/* ONI Mod Manager - frontend application
 * Split out of the original single-file index.html for maintainability.
 */
        /* ============================================================
           ONI Mod Manager - Frontend Application
           ============================================================ */

        const API_BASE = '';
        const _t = function(k, vars) { return (window.__i18n && window.__i18n.t) ? window.__i18n.t(k, vars) : (k.replace(/.*\./, '')); };

        // ─── State ────────────────────────────────────────────────
        const state = {
            currentPage: 'workshop',
            currentDetail: null,
            currentDetailType: null, // 'workshop' | 'local' | 'wegame'
            workshopMods: [],
            localMods: [],
            wegameMods: [],
            selectedForDeploy: new Set(),
            downloadStatus: { queue: [], active: [], completed: [], failed: [] },
            settings: {},
            listView: false,
            downloadPolling: null,
            workshopSearchAbort: null,   // AbortController for search requests
            apiTimeout: 15000,           // 15s timeout for all API calls
            workshopPage: 1,
            workshopTotal: 0,
        };

        // ─── DOM Refs ────────────────────────────────────────────
        const $ = (sel) => document.querySelector(sel);
        const $$ = (sel) => document.querySelectorAll(sel);

        // ─── Global Error Handling ───────────────────────────────
        window.onerror = function(msg, url, line, col, error) {
            const el = document.getElementById('status-left');
            if (el) el.textContent = 'JS ERROR: ' + msg + ' (line ' + line + ')';
            console.error('ONI Error:', msg, 'at line', line, 'col', col, error);
            return false;
        };
        window.addEventListener('unhandledrejection', function(event) {
            const el = document.getElementById('status-left');
            if (el) el.textContent = 'PROMISE ERROR: ' + (event.reason?.message || event.reason);
            console.error('ONI Unhandled Rejection:', event.reason);
        });

        // ─── Initialization ──────────────────────────────────────
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                initNavigation();
                initSearch();
                initCategoryTags();
                await initSettings();
                loadWorkshopMods();
                startDownloadPolling();
                detectWeGamePaths();
                updateStatusBar();
                console.log('ONI: All init functions completed successfully.');
            } catch (e) {
                console.error('ONI: Init error:', e);
                const el = document.getElementById('status-left');
                if (el) el.textContent = 'INIT ERROR: ' + e.message;
            }
        });

        function initNavigation() {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    const page = item.dataset.page;
                    switchPage(page);
                });
            });
            $('#toggle-view').addEventListener('click', toggleListView);
        }

        function switchPage(page) {
            state.currentPage = page;

            // Cancel any in-flight search request
            if (state.workshopSearchAbort) {
                state.workshopSearchAbort.abort();
                state.workshopSearchAbort = null;
            }

            // Manage download polling: only poll when on downloads page
            if (page !== 'downloads' && state.downloadPolling) {
                clearInterval(state.downloadPolling);
                state.downloadPolling = null;
            }
            if (page === 'downloads' && !state.downloadPolling) {
                loadDownloadPage();
                state.downloadPolling = setInterval(loadDownloadPage, 3000);
            }

            // Update nav
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

            // Update page visibility
            document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
            const targetPage = $(`#page-${page}`);
            if (targetPage) targetPage.classList.remove('hidden');

            // Update header
            const t = window.__i18n ? window.__i18n.t : function(k) { return k; };
            $('#page-title').textContent = t('page.' + page) || page;

            // Show/hide search
            const showSearch = ['workshop', 'local'].includes(page);
            $('#search-container').style.display = showSearch ? '' : 'none';
            $('#filter-container').style.display = page === 'workshop' ? '' : 'none';
            $('#category-tags').style.display = page === 'workshop' ? '' : 'none';

            // Load data
            if (page === 'downloads') loadDownloadPage();
            if (page === 'local') loadLocalMods();
            if (page === 'wegame') loadWeGamePage();
            if (page === 'settings') refreshSettingsDisplay();

            closeDetail();
        }

        // ─── Search ──────────────────────────────────────────────
        function initSearch() {
            const input = $('#search-input');
            let debounceTimer;
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    state.workshopPage = 1;
                    if (state.currentPage === 'workshop') loadWorkshopMods();
                    if (state.currentPage === 'local') filterLocalMods();
                }, 400);
            });

            $('#sort-select').addEventListener('change', () => {
                state.workshopPage = 1;
                if (state.currentPage === 'workshop') loadWorkshopMods();
            });
        }

        function initCategoryTags() {
            document.querySelectorAll('#category-tags .filter-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    document.querySelectorAll('#category-tags .filter-tag').forEach(t => t.classList.remove('active'));
                    tag.classList.add('active');
                    state.workshopPage = 1;
                    loadWorkshopMods();
                });
            });
        }

        // ─── Workshop ────────────────────────────────────────────
        async function loadWorkshopMods() {
            // Cancel any previous in-flight search
            if (state.workshopSearchAbort) {
                state.workshopSearchAbort.abort();
                state.workshopSearchAbort = null;
            }

            const keyword = $('#search-input').value.trim();
            const sort = $('#sort-select').value;
            const activeCategory = document.querySelector('#category-tags .filter-tag.active');
            const category = activeCategory ? activeCategory.dataset.category : '';

            showLoading('workshop');
            $('#workshop-empty').classList.add('hidden');
            $('#workshop-notice').classList.add('hidden');

            // Show API key banner if no key configured
            if (!state.settings.steam_api_key) {
                $('#workshop-apikey-banner').classList.remove('hidden');
            } else {
                $('#workshop-apikey-banner').classList.add('hidden');
            }

            const params = new URLSearchParams({ keyword, sort, category, per_page: 30, page: state.workshopPage });
            const { promise, abort } = createAbortableFetch(`${API_BASE}/api/workshop/search?${params}`, {}, state.apiTimeout);
            state.workshopSearchAbort = { abort };

            try {
                const resp = await promise;
                state.workshopSearchAbort = null;
                const data = await resp.json();

                hideLoading('workshop');
                state.workshopMods = data.mods || [];
                state.workshopTotal = data.total || state.workshopMods.length;

                if (data.notice) {
                    $('#workshop-notice').textContent = data.notice;
                    $('#workshop-notice').classList.remove('hidden');
                }

                renderWorkshopMods();
            } catch (err) {
                state.workshopSearchAbort = null;
                hideLoading('workshop');
                if (err.aborted) return; // silently ignore cancelled requests
                showToast(_t('toast.search.fail'), 'error');
                state.workshopMods = [];
                renderWorkshopMods();
            }
        }

        function renderWorkshopMods() {
            const container = $('#workshop-mods');
            container.innerHTML = '';

            if (state.workshopMods.length === 0) {
                $('#workshop-empty').classList.remove('hidden');
                $('#workshop-pagination').classList.add('hidden');
                return;
            }
            $('#workshop-empty').classList.add('hidden');

            const cls = state.listView ? 'list-view' : '';
            container.className = `mod-grid ${cls}`;

            state.workshopMods.forEach(mod => {
                const card = createModCard(mod, 'workshop');
                container.appendChild(card);
            });

            renderPagination();
        }

        function renderPagination() {
            const container = $('#workshop-pagination');
            const total = state.workshopTotal;
            const perPage = 30;
            const pages = Math.ceil(total / perPage);
            const page = state.workshopPage;

            if (pages <= 1) {
                container.classList.add('hidden');
                return;
            }
            container.classList.remove('hidden');
            container.innerHTML = '';

            const t = window.__i18n ? window.__i18n.t : function(k, v) { return k; };

            // Prev button
            const prev = document.createElement('button');
            prev.className = 'pagination-btn';
            prev.textContent = '◀ ' + t('workshop.pagination.prev');
            prev.disabled = page <= 1;
            prev.onclick = () => goToWorkshopPage(page - 1);
            container.appendChild(prev);

            // Page buttons
            const maxVisible = 7;
            let start = Math.max(1, page - Math.floor(maxVisible / 2));
            let end = Math.min(pages, start + maxVisible - 1);
            if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

            for (let i = start; i <= end; i++) {
                const btn = document.createElement('button');
                btn.className = 'pagination-btn' + (i === page ? ' active' : '');
                btn.textContent = i;
                btn.onclick = () => goToWorkshopPage(i);
                container.appendChild(btn);
            }

            // Next button
            const next = document.createElement('button');
            next.className = 'pagination-btn';
            next.textContent = t('workshop.pagination.next') + ' ▶';
            next.disabled = page >= pages;
            next.onclick = () => goToWorkshopPage(page + 1);
            container.appendChild(next);

            // Info
            const info = document.createElement('span');
            info.className = 'pagination-info';
            info.textContent = t('workshop.pagination.total', { total }) + ' · ' + t('workshop.pagination.page', { page, pages });
            container.appendChild(info);
        }

        function goToWorkshopPage(page) {
            state.workshopPage = page;
            loadWorkshopMods();
            // Scroll to top of mod grid
            $('#workshop-mods').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function createModCard(mod, type) {
            const card = document.createElement('div');
            card.className = 'mod-card';
            card.onclick = (e) => {
                if (e.target.tagName === 'BUTTON') return;
                showDetail(mod, type);
            };

            const subsText = mod.subscriptions ? `${formatNumber(mod.subscriptions)} 订阅` : '';
            const updateTime = mod.time_updated ? new Date(mod.time_updated * 1000).toLocaleDateString('zh-CN') : '';

            card.innerHTML = `
                <div class="mod-card-img">
                    ${mod.preview_url ? `<img src="${mod.preview_url}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='?'"/>` : '?'}
                </div>
                <div class="mod-card-body">
                    <div class="mod-card-title" title="${escapeHtml(mod.title || '')}">${escapeHtml(mod.title || _t('detail.unknown'))}</div>
                    <div class="mod-card-meta">
                        <span>${escapeHtml(mod.author || _t('detail.unknown'))}</span>
                        ${subsText ? `<span>${subsText}</span>` : ''}
                        ${updateTime ? `<span>${updateTime}</span>` : ''}
                    </div>
                    <div class="mod-card-actions">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();downloadMod('${mod.id}','${escapeHtml(mod.title || '')}')">${_t('detail.action.download')}</button>
                    </div>
                </div>
            `;
            return card;
        }

        function downloadMod(modId, modName) {
            fetchWithTimeout(`${API_BASE}/api/download/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mod_id: modId,
                    mod_name: modName,
                    download_source: state.settings.preferred_download_source || 'steam_cdn'
                })
            }, state.apiTimeout)
            .then(r => r.json())
            .then(data => {
                if (data.status === 'queued') {
                    showToast(_t('toast.download.queued', { name: modName }), 'success');
                } else if (data.status === 'exists') {
                    showToast(data.message, 'warning');
                }
                if (state.currentPage === 'downloads') loadDownloadPage();
            })
            .catch(err => { if (!err.aborted) showToast(_t('toast.download.fail'), 'error'); });
        }

        // ─── Detail Panel ────────────────────────────────────────
        function showDetail(mod, type) {
            state.currentDetail = mod;
            state.currentDetailType = type;

            $('#detail-empty').style.display = 'none';
            $('#detail-content').classList.add('active');

            // 本地模组的 preview 是绝对文件路径，必须套上 /api/preview/ 才能当 URL 用
            // （工坊模组的 preview_url 本身就是 http 地址，直接用）
            const previewSrc = mod.preview_url || mod.preview || '';
            const previewUrl = previewSrc
                ? (/^(https?:|\/)/i.test(previewSrc) ? previewSrc : '/api/preview/' + previewSrc)
                : '';
            $('#detail-preview').src = previewUrl;
            $('#detail-preview').style.display = previewUrl ? '' : 'none';
            $('#detail-name').textContent = mod.title || _t('detail.unknown');
            $('#detail-author').textContent = mod.author || _t('detail.unknown');
            $('#detail-subs').textContent = mod.subscriptions ? formatNumber(mod.subscriptions) : '-';
            $('#detail-version').textContent = mod.version || '-';
            $('#detail-size').textContent = mod.size ? formatSize(mod.size) : '-';
            $('#detail-desc').textContent = mod.description || _t('detail.no_desc');
            // Show translate button if description exists and is not placeholder
            const hasDesc = mod.description && mod.description.trim();
            $('#btn-translate-desc').style.display = hasDesc ? '' : 'none';
            $('#detail-desc-translated').style.display = 'none';
            $('#detail-desc').style.display = '';
            state.descTranslated = false;

            // Actions
            const actions = $('#detail-actions');
            actions.innerHTML = '';

            if (type === 'workshop') {
                actions.innerHTML += `<button class="btn btn-primary btn-block" onclick="downloadMod('${mod.id}','${escapeHtml(mod.title)}')">${_t('detail.action.download')}</button>`;
                if (mod.url) {
                    actions.innerHTML += `<button class="btn btn-ghost btn-block btn-sm" onclick="window.open('${mod.url}','_blank')">${_t('detail.action.steam')}</button>`;
                }
            }
            if (type === 'local') {
                actions.innerHTML += `<button class="btn btn-orange btn-block" onclick="deploySingleMod('${mod.id}')">${_t('detail.action.deploy')}</button>`;
                actions.innerHTML += `<button class="btn btn-ghost btn-block btn-sm" onclick="openModFolder('${mod.id}')">${_t('detail.action.open')}</button>`;
                actions.innerHTML += `<button class="btn btn-red btn-block btn-sm" onclick="deleteLocalMod('${mod.id}')">${_t('detail.action.delete')}</button>`;
            }
            if (type === 'wegame') {
                const enabledText = mod.enabled ? _t('detail.action.disable') : _t('detail.action.enable');
                actions.innerHTML += `<button class="btn ${mod.enabled ? 'btn-ghost' : 'btn-green'} btn-block" onclick="toggleWeGameMod('${mod.id}', ${!mod.enabled})">${enabledText}</button>`;
                actions.innerHTML += `<button class="btn btn-red btn-block btn-sm" onclick="uninstallWeGameMod('${mod.id}')">${_t('detail.action.uninstall')}</button>`;
            }
        }

        function closeDetail() {
            state.currentDetail = null;
            state.currentDetailType = null;
            $('#detail-empty').style.display = '';
            $('#detail-content').classList.remove('active');
        }

        // ─── Description Translation ────────────────────────────
        async function translateDescription() {
            const btn = $('#btn-translate-desc');
            const descEl = $('#detail-desc');
            const transEl = $('#detail-desc-translated');

            if (state.descTranslated) {
                descEl.style.display = '';
                transEl.style.display = 'none';
                btn.textContent = '🌐 翻译';
                state.descTranslated = false;
                return;
            }

            const modName = $('#detail-name').textContent;
            const modDesc = descEl.textContent;
            if (!modDesc || modDesc === _t('detail.no_desc')) return;

            // 组合名称和描述一起翻译
            const combined = '【' + modName + '】\n' + modDesc;

            btn.textContent = '⏳ 翻译中...';
            btn.disabled = true;

            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: combined, target: 'zh' })
                }, 30000);
                const data = await resp.json();

                if (data.success) {
                    transEl.textContent = data.translated;
                    transEl.style.display = '';
                    btn.textContent = '📋 原文';
                    state.descTranslated = true;
                } else {
                    showToast('翻译失败: ' + (data.error || '未知错误'), 'error');
                    btn.textContent = '🌐 翻译';
                }
            } catch (err) {
                if (!err.aborted) showToast('翻译请求失败，请重试', 'error');
                btn.textContent = '🌐 翻译';
            } finally {
                btn.disabled = false;
            }
        }

        // ─── Downloads ───────────────────────────────────────────
        function startDownloadPolling() {
            // Only start polling if currently on downloads page
            if (state.currentPage === 'downloads') {
                loadDownloadPage();
                state.downloadPolling = setInterval(loadDownloadPage, 3000);
            }
        }

        async function loadDownloadPage() {
            if (state.currentPage !== 'downloads') return;
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/download/status`, {}, state.apiTimeout);
                const data = await resp.json();
                state.downloadStatus = data;

                renderDownloadSection('download-active', data.active, true);
                renderDownloadSection('download-queue', data.queue, false);
                renderDownloadSection('download-completed', data.completed, false);
                renderDownloadSection('download-failed', data.failed, false);

                // Update badge
                const activeCount = (data.active || []).length + (data.queue || []).length;
                const badge = $('#download-badge');
                if (activeCount > 0) {
                    badge.textContent = activeCount;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }

                // Show/hide empty state
                const hasAny = (data.active || []).length + (data.queue || []).length + (data.completed || []).length + (data.failed || []).length > 0;
                $('#downloads-empty').classList.toggle('hidden', hasAny);
            } catch (err) {
                // silent
            }
        }

        function renderDownloadSection(containerId, items, isActive) {
            const container = $(`#${containerId}`);
            if (!container) return;
            if (!items || items.length === 0) {
                container.innerHTML = '<div class="text-dim" style="padding:8px;font-size:12px;">无</div>';
                return;
            }

            container.innerHTML = items.map(item => {
                if (isActive) {
                    return `
                        <div class="download-item">
                            <span class="spinner" style="width:16px;height:16px;flex-shrink:0;"></span>
                            <div class="download-item-info">
                                <div class="download-item-name">${escapeHtml(item.mod_name)}</div>
                                <div class="download-item-status">
                                    ${formatSize(item.downloaded)} / ${formatSize(item.size)} · ${formatSpeed(item.speed)}
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width:${item.progress || 0}%"></div>
                                </div>
                            </div>
                            <button class="btn btn-ghost btn-sm" onclick="cancelDownload('${item.mod_id}')">取消</button>
                        </div>
                    `;
                } else {
                    const statusClass = item.status === 'completed' ? 'badge-green' : 'badge-red';
                    const statusText = item.status === 'completed' ? '完成' : (item.error || '失败');
                    return `
                        <div class="download-item">
                            <span class="badge ${statusClass}">${statusText}</span>
                            <div class="download-item-info">
                                <div class="download-item-name">${escapeHtml(item.mod_name)}</div>
                                <div class="download-item-status">${item.completed_time ? new Date(item.completed_time).toLocaleString('zh-CN') : ''}</div>
                            </div>
                            ${item.status === 'failed' ? `<button class="btn btn-ghost btn-sm" onclick="downloadMod('${item.mod_id}','${escapeHtml(item.mod_name)}')">重试</button>` : ''}
                        </div>
                    `;
                }
            }).join('');
        }

        function cancelDownload(modId) {
            fetchWithTimeout(`${API_BASE}/api/download/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mod_id: modId })
            }, state.apiTimeout)
            .then(() => { loadDownloadPage(); showToast(_t('toast.download.cancelled'), 'info'); })
            .catch(err => { if (!err.aborted) showToast(_t('toast.cancel.fail'), 'error'); });
        }

        function clearDownloadHistory() {
            fetchWithTimeout(`${API_BASE}/api/download/clear_history`, { method: 'POST' }, state.apiTimeout)
            .then(r => r.json())
            .then(() => { loadDownloadPage(); showToast(_t('toast.download.cleared'), 'success'); });
        }

        // ─── Local Mods ──────────────────────────────────────────
        async function loadLocalMods() {
            if (state.currentPage !== 'local') return;
            showLoading('local');
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/local/mods`, {}, state.apiTimeout);
                const data = await resp.json();
                state.localMods = data.mods || [];
                hideLoading('local');
                renderLocalMods();
            } catch (err) {
                hideLoading('local');
                if (!err.aborted) showToast(_t('toast.local.load_fail'), 'error');
            }
        }

        function filterLocalMods() {
            renderLocalMods();
        }

        function renderLocalMods() {
            const container = $('#local-mods');
            container.innerHTML = '';

            const keyword = $('#search-input').value.trim().toLowerCase();
            let mods = state.localMods;
            if (keyword) {
                mods = mods.filter(m =>
                    (m.title || '').toLowerCase().includes(keyword) ||
                    (m.author || '').toLowerCase().includes(keyword)
                );
            }

            if (mods.length === 0) {
                $('#local-empty').classList.remove('hidden');
                return;
            }
            $('#local-empty').classList.add('hidden');

            const cls = state.listView ? 'list-view' : '';
            container.className = `mod-grid ${cls}`;

            mods.forEach(mod => {
                const card = document.createElement('div');
                card.className = 'mod-card';
                card.onclick = (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    showDetail({ ...mod, id: mod.id || mod.static_id, preview: mod.preview, type: 'local' }, 'local');
                };

                card.innerHTML = `
                    <div class="mod-card-img">${mod.preview ? `<img src="/api/preview/${mod.preview}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='?'"/>` : '?'}</div>
                    <div class="mod-card-body">
                        <div class="mod-card-title">${escapeHtml(mod.title || mod.id)}</div>
                        <div class="mod-card-meta">
                            <span>${escapeHtml(mod.author || '未知')}</span>
                            <span>v${escapeHtml(mod.version || '?')}</span>
                            <span>${formatSize(mod.size)}</span>
                        </div>
                        <div class="mod-card-actions">
                            <button class="btn btn-orange btn-sm" onclick="event.stopPropagation();deploySingleMod('${mod.id}')">搬运</button>
                            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openModFolder('${mod.id}')">打开</button>
                            <button class="btn btn-red btn-sm" onclick="event.stopPropagation();deleteLocalMod('${mod.id}')">删除</button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function openModFolder(modId) {
            fetchWithTimeout(`${API_BASE}/api/local/mods/${modId}/open`, {}, state.apiTimeout)
                .then(r => r.json())
                .then(d => { if (!d.success) showToast(d.error, 'error'); })
                .catch(err => { if (!err.aborted) showToast(_t('toast.open_folder.fail'), 'error'); });
        }

        function deleteLocalMod(modId) {
            if (!confirm(`确定要删除模组 "${modId}" 吗？此操作不可撤销。`)) return;
            fetchWithTimeout(`${API_BASE}/api/local/mods/${modId}`, { method: 'DELETE' }, state.apiTimeout)
                .then(r => r.json())
                .then(d => {
                    showToast(d.message, d.success ? 'success' : 'error');
                    if (d.success) loadLocalMods();
                })
                .catch(err => { if (!err.aborted) showToast(_t('toast.delete.fail'), 'error'); });
        }

        function triggerFileImport() {
            $('#import-file-input').click();
        }

        async function handleFileImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/download/import`, {
                    method: 'POST',
                    body: formData,
                }, 60000); // 60s for file upload
                const data = await resp.json();
                showToast(data.message, data.success ? 'success' : 'error');
                if (data.success) loadLocalMods();
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.import.fail'), 'error');
            }
        }

        // ─── WeGame ──────────────────────────────────────────────
        async function loadWeGamePage() {
            if (state.currentPage !== 'wegame') return;
            await Promise.all([loadLocalForWeGame(), loadWeGameMods()]);
        }

        function refreshWeGamePage() {
            loadWeGamePage();
        }

        async function loadLocalForWeGame() {
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/local/mods`, {}, state.apiTimeout);
                const data = await resp.json();
                const container = $('#wegame-local-list');
                const mods = data.mods || [];

                container.innerHTML = mods.map(m => {
                    const selected = state.selectedForDeploy.has(m.id) ? 'selected' : '';
                    return `
                        <div class="transfer-item ${selected}" onclick="toggleDeploySelect('${m.id}')" data-mod-id="${m.id}">
                            <div class="check"></div>
                            <span style="flex:1" class="truncate">${escapeHtml(m.title || m.id)}</span>
                            <span class="text-dim" style="font-size:11px">${formatSize(m.size)}</span>
                        </div>
                    `;
                }).join('') || '<div class="text-dim text-center" style="padding:20px">本地模组库为空</div>';
            } catch (err) {
                $('#wegame-local-list').innerHTML = '<div class="text-dim text-center" style="padding:20px">加载失败</div>';
            }
        }

        async function loadWeGameMods() {
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/wegame/mods`, {}, state.apiTimeout);
                const data = await resp.json();
                state.wegameMods = data.mods || [];
                const container = $('#wegame-installed-list');

                container.innerHTML = state.wegameMods.map(m => `
                    <div class="transfer-item" onclick="showDetail(${JSON.stringify({...m, type:'wegame'}).replace(/"/g, '&quot;')}, 'wegame')">
                        <span class="badge ${m.enabled ? 'badge-green' : 'badge-red'}">${m.enabled ? '启用' : '禁用'}</span>
                        <span style="flex:1" class="truncate">${escapeHtml(m.title || m.id)}</span>
                        <span class="text-dim" style="font-size:11px">v${escapeHtml(m.version || '?')}</span>
                    </div>
                `).join('') || '<div class="text-dim text-center" style="padding:20px">WeGame 模组目录为空</div>';
            } catch (err) {
                $('#wegame-installed-list').innerHTML = '<div class="text-dim text-center" style="padding:20px">加载失败</div>';
            }
        }

        function toggleDeploySelect(modId) {
            if (state.selectedForDeploy.has(modId)) {
                state.selectedForDeploy.delete(modId);
            } else {
                state.selectedForDeploy.add(modId);
            }
            // Update UI
            const el = document.querySelector(`.transfer-item[data-mod-id="${modId}"]`);
            if (el) el.classList.toggle('selected');
        }

        async function deploySelectedMods() {
            if (state.selectedForDeploy.size === 0) {
                showToast(_t('toast.wegame.select_first'), 'warning');
                return;
            }

            const modIds = Array.from(state.selectedForDeploy);
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/wegame/batch_deploy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mod_ids: modIds, force: false })
                }, state.apiTimeout);
                const data = await resp.json();
                showToast(data.summary, data.success ? 'success' : 'warning');

                // Handle exists errors
                const exists = data.results ? data.results.filter(r => r.exists) : [];
                if (exists.length > 0) {
                    const names = exists.map(e => e.mod_id).join(', ');
                    if (confirm(`以下模组已存在于 WeGame 目录: ${names}。是否覆盖？`)) {
                        // Force deploy
                        const resp2 = await fetchWithTimeout(`${API_BASE}/api/wegame/batch_deploy`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ mod_ids: exists.map(e => e.mod_id), force: true })
                        }, state.apiTimeout);
                        const data2 = await resp2.json();
                        showToast(data2.summary, data2.success ? 'success' : 'error');
                    }
                }

                state.selectedForDeploy.clear();
                loadWeGamePage();
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.deploy.fail'), 'error');
            }
        }

        async function deploySingleMod(modId) {
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/wegame/deploy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mod_id: modId, force: false })
                }, state.apiTimeout);
                const data = await resp.json();
                if (data.exists) {
                    if (confirm(`模组 ${modId} 已存在，是否覆盖？`)) {
                        const resp2 = await fetchWithTimeout(`${API_BASE}/api/wegame/deploy`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ mod_id: modId, force: true })
                        }, state.apiTimeout);
                        const data2 = await resp2.json();
                        showToast(data2.message, data2.success ? 'success' : 'error');
                    }
                } else {
                    showToast(data.message, data.success ? 'success' : 'error');
                }
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.deploy.fail'), 'error');
            }
        }

        async function toggleWeGameMod(modId, enabled) {
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/wegame/toggle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mod_id: modId, enabled })
                }, state.apiTimeout);
                const data = await resp.json();
                showToast(data.message, data.success ? 'success' : 'error');
                if (data.success) loadWeGameMods();
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.operation.fail'), 'error');
            }
        }

        async function uninstallWeGameMod(modId) {
            if (!confirm(`确定要从 WeGame 卸载模组 "${modId}" 吗？`)) return;
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/wegame/uninstall`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mod_id: modId })
                }, state.apiTimeout);
                const data = await resp.json();
                showToast(data.message, data.success ? 'success' : 'error');
                if (data.success) loadWeGameMods();
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.uninstall.fail'), 'error');
            }
        }

        // ─── Settings ────────────────────────────────────────────
        async function initSettings() {
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/settings`, {}, state.apiTimeout);
                state.settings = await resp.json();
            } catch (err) {
                state.settings = {};
            }
        }

        function refreshSettingsDisplay() {
            $('#set-game-dir').value = state.settings.wegame_game_dir || '';
            $('#set-mods-dir').value = state.settings.wegame_mods_dir || '';
            $('#set-download-dir').value = state.settings.download_dir || '';
            $('#set-local-dir').value = state.settings.mods_dir || '';
            $('#set-download-source').value = state.settings.preferred_download_source || 'steam_cdn';
            $('#set-max-threads').value = state.settings.max_download_threads || 3;
            $('#set-proxy').value = state.settings.proxy || '';
            $('#set-apikey').value = state.settings.steam_api_key || '';
            $('#set-notify').checked = state.settings.notification_enabled !== false;
            $('#set-auto-update').checked = state.settings.auto_check_update !== false;
        }

        async function saveAllSettings() {
            const newSettings = {
                wegame_game_dir: $('#set-game-dir').value,
                wegame_mods_dir: $('#set-mods-dir').value,
                download_dir: $('#set-download-dir').value,
                mods_dir: $('#set-local-dir').value,
                preferred_download_source: $('#set-download-source').value,
                max_download_threads: parseInt($('#set-max-threads').value) || 3,
                proxy: $('#set-proxy').value,
                steam_api_key: $('#set-apikey').value,
                notification_enabled: $('#set-notify').checked,
                auto_check_update: $('#set-auto-update').checked,
            };

            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSettings)
                }, state.apiTimeout);
                const data = await resp.json();
                state.settings = { ...state.settings, ...newSettings };
                showToast(data.message, 'success');
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.save.fail'), 'error');
            }
        }

        async function resetSettings() {
            if (!confirm('确定恢复默认设置？')) return;
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/settings/reset`, { method: 'POST' }, state.apiTimeout);
                const data = await resp.json();
                await initSettings();
                refreshSettingsDisplay();
                showToast(data.message, 'success');
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.reset.fail'), 'error');
            }
        }

        async function detectWeGamePaths() {
            try {
                const resp = await fetchWithTimeout(`${API_BASE}/api/wegame/detect`, {}, state.apiTimeout);
                const data = await resp.json();
                if (data.wegame_game_dir) $('#set-game-dir').value = data.wegame_game_dir;
                if (data.wegame_mods_dir) $('#set-mods-dir').value = data.wegame_mods_dir;
                showToast(data.detected ? _t('toast.path.detected') : _t('toast.path.not_detected'), data.detected ? 'success' : 'warning');
            } catch (err) {
                if (!err.aborted) showToast(_t('toast.detect.fail'), 'error');
            }
        }

        // ─── Utility ─────────────────────────────────────────────
        /**
         * Fetch wrapper with timeout via AbortController.
         * Returns { response, aborted } or throws.
         */
        function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const signal = controller.signal;

            return fetch(url, { ...options, signal })
                .then(response => {
                    clearTimeout(timer);
                    return response;
                })
                .catch(err => {
                    clearTimeout(timer);
                    if (err.name === 'AbortError') {
                        const customErr = new Error('请求超时或已取消');
                        customErr.aborted = true;
                        throw customErr;
                    }
                    throw err;
                });
        }

        /**
         * Abortable fetch: returns { promise, abort() }
         */
        function createAbortableFetch(url, options = {}, timeoutMs = 15000) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const signal = controller.signal;

            const promise = fetch(url, { ...options, signal })
                .then(response => {
                    clearTimeout(timer);
                    return response;
                })
                .catch(err => {
                    clearTimeout(timer);
                    if (err.name === 'AbortError') {
                        const customErr = new Error('请求已取消');
                        customErr.aborted = true;
                        throw customErr;
                    }
                    throw err;
                });

            return {
                promise,
                abort: () => controller.abort()
            };
        }

        function toggleListView() {
            state.listView = !state.listView;
            if (state.currentPage === 'workshop') renderWorkshopMods();
            if (state.currentPage === 'local') renderLocalMods();
        }

        function showLoading(page) {
            const el = $(`#${page}-loading`);
            if (el) el.classList.remove('hidden');
        }

        function hideLoading(page) {
            const el = $(`#${page}-loading`);
            if (el) el.classList.add('hidden');
        }

        function updateStatusBar() {
            const now = new Date();
            $('#status-right').textContent = now.toLocaleString('zh-CN');
            $('#status-left').textContent = `就绪 | API: ${API_BASE || '本地'}`;
            setTimeout(updateStatusBar, 30000);
        }

        function showToast(message, type = 'info') {
            const container = $('#toast-container');
            if (!container) { console.warn('ONI: toast-container not found'); return; }
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;

            const icons = { success: '\u2714', error: '\u2716', warning: '\u26A0', info: '\u2139' };
            toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 10000) return (num / 1000).toFixed(1) + 'K';
            return num.toLocaleString();
        }

        function formatSize(bytes) {
            if (!bytes) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            let size = bytes;
            while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
            return `${size.toFixed(1)} ${units[i]}`;
        }

        function formatSpeed(bytesPerSec) {
            if (!bytesPerSec || bytesPerSec <= 0) return '--';
            return formatSize(bytesPerSec) + '/s';
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                $('#search-input').focus();
            }
            if (e.key === 'Escape') {
                closeDetail();
            }
        });
    
