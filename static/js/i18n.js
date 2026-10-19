/* ============================================================
   ONI Mod Manager - i18n Translation Module
   ============================================================ */
(function () {
  const I18N_KEY = 'oni_mod_manager_locale';

  const LANGUAGES = {
    'zh-CN': { label: '中文', flag: 'CN' },
    en: { label: 'English', flag: 'US' },
    ja: { label: '日本語', flag: 'JP' },
    ko: { label: '한국어', flag: 'KR' },
    ru: { label: 'Русский', flag: 'RU' },
  };

  const T = {
    // Nav
    'nav.workshop': { 'zh-CN': '创意工坊', en: 'Workshop', ja: 'ワークショップ', ko: '창작마당', ru: 'Мастерская' },
    'nav.downloads': { 'zh-CN': '下载管理', en: 'Downloads', ja: 'ダウンロード', ko: '다운로드', ru: 'Загрузки' },
    'nav.local': { 'zh-CN': '本地模组库', en: 'Local Mods', ja: 'ローカルMOD', ko: '로컬 모드', ru: 'Локальные моды' },
    'nav.wegame': { 'zh-CN': 'WeGame管理', en: 'WeGame', ja: 'WeGame管理', ko: 'WeGame 관리', ru: 'WeGame' },
    'nav.settings': { 'zh-CN': '设置', en: 'Settings', ja: '設定', ko: '설정', ru: 'Настройки' },
    // Header
    'page.workshop': { 'zh-CN': '创意工坊', en: 'Workshop', ja: 'ワークショップ', ko: '창작마당', ru: 'Мастерская' },
    'page.downloads': { 'zh-CN': '下载管理', en: 'Downloads', ja: 'ダウンロード', ko: '다운로드', ru: 'Загрузки' },
    'page.local': { 'zh-CN': '本地模组库', en: 'Local Mods', ja: 'ローカルMOD', ko: '로컬 모드', ru: 'Локальные моды' },
    'page.wegame': { 'zh-CN': 'WeGame管理', en: 'WeGame', ja: 'WeGame管理', ko: 'WeGame 관리', ru: 'WeGame' },
    'page.settings': { 'zh-CN': '设置', en: 'Settings', ja: '設定', ko: '설정', ru: 'Настройки' },
    // Search
    'search.placeholder': { 'zh-CN': '搜索缺氧模组...', en: 'Search ONI mods...', ja: 'ONI MODを検索...', ko: 'ONI 모드 검색...', ru: 'Поиск модов ONI...' },
    // Sort
    'sort.popular': { 'zh-CN': '按热度', en: 'Popular', ja: '人気順', ko: '인기순', ru: 'Популярные' },
    'sort.newest': { 'zh-CN': '按最新', en: 'Newest', ja: '新着順', ko: '최신순', ru: 'Новейшие' },
    'sort.rating': { 'zh-CN': '按评分', en: 'Rating', ja: '評価順', ko: '평점순', ru: 'Рейтинг' },
    // Category tags
    'cat.all': { 'zh-CN': '全部', en: 'All', ja: 'すべて', ko: '전체', ru: 'Все' },
    'cat.functional': { 'zh-CN': '功能类', en: 'Functional', ja: '機能', ko: '기능', ru: 'Функции' },
    'cat.cosmetic': { 'zh-CN': '美化类', en: 'Cosmetic', ja: '美化', ko: '꾸미기', ru: 'Косметика' },
    'cat.building': { 'zh-CN': '建筑类', en: 'Building', ja: '建築', ko: '건축', ru: 'Строения' },
    'cat.gameplay': { 'zh-CN': '玩法类', en: 'Gameplay', ja: 'ゲームプレイ', ko: '게임플레이', ru: 'Геймплей' },
    'cat.tool': { 'zh-CN': '工具类', en: 'Tools', ja: 'ツール', ko: '도구', ru: 'Инструменты' },
    // Workshop
    'workshop.loading': { 'zh-CN': '搜索模组中...', en: 'Searching mods...', ja: 'MODを検索中...', ko: '모드 검색 중...', ru: 'Поиск модов...' },
    'workshop.empty': { 'zh-CN': '未找到模组', en: 'No mods found', ja: 'MODが見つかりません', ko: '모드를 찾을 수 없음', ru: 'Моды не найдены' },
    'workshop.empty_hint': { 'zh-CN': '尝试换个关键词，或检查网络连接', en: 'Try different keywords or check connection', ja: '別のキーワードを試すか、接続を確認してください', ko: '다른 키워드를 시도하거나 연결을 확인하세요', ru: 'Попробуйте другие ключевые слова' },
    'workshop.apikey_banner': { 'zh-CN': '未配置 Steam API Key，当前显示热门推荐。请在 <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a> 获取免费 Key，并在设置中填入后即可搜索真实模组。', en: 'Steam API Key not configured. Showing trending mods. Get a free key at <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a> and enter it in Settings to search real mods.', ja: 'Steam APIキーが設定されていません。人気MODを表示中です。<a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a>で無料キーを取得し、設定に入力してください。', ko: 'Steam API 키가 설정되지 않았습니다. 인기 모드를 표시합니다. <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a>에서 무료 키를 받아 설정에 입력하세요.', ru: 'Ключ Steam API не настроен. Показаны популярные моды. Получите ключ на <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a> и укажите в настройках.' },
    'workshop.pagination.prev': { 'zh-CN': '上一页', en: 'Prev', ja: '前へ', ko: '이전', ru: 'Назад' },
    'workshop.pagination.next': { 'zh-CN': '下一页', en: 'Next', ja: '次へ', ko: '다음', ru: 'Далее' },
    'workshop.pagination.total': { 'zh-CN': '共 {total} 个结果', en: '{total} results total', ja: '全{total}件', ko: '총 {total}개', ru: 'Всего: {total}' },
    'workshop.pagination.page': { 'zh-CN': '第 {page}/{pages} 页', en: 'Page {page}/{pages}', ja: '{page}/{pages}ページ', ko: '{page}/{pages}페이지', ru: 'Стр. {page}/{pages}' },
    // Detail panel
    'detail.title': { 'zh-CN': '模组详情', en: 'Mod Details', ja: 'MOD詳細', ko: '모드 상세', ru: 'Описание мода' },
    'detail.empty': { 'zh-CN': '选择一个模组查看详情', en: 'Select a mod to view details', ja: 'MODを選択して詳細を表示', ko: '모드를 선택하여 상세 보기', ru: 'Выберите мод для просмотра' },
    'detail.name': { 'zh-CN': '名称', en: 'Name', ja: '名前', ko: '이름', ru: 'Название' },
    'detail.author': { 'zh-CN': '作者', en: 'Author', ja: '作者', ko: '작성자', ru: 'Автор' },
    'detail.subs': { 'zh-CN': '订阅数', en: 'Subscribers', ja: '登録者', ko: '구독자', ru: 'Подписчики' },
    'detail.version': { 'zh-CN': '版本', en: 'Version', ja: 'バージョン', ko: '버전', ru: 'Версия' },
    'detail.size': { 'zh-CN': '大小', en: 'Size', ja: 'サイズ', ko: '크기', ru: 'Размер' },
    'detail.description': { 'zh-CN': '描述', en: 'Description', ja: '説明', ko: '설명', ru: 'Описание' },
    'detail.alt': { 'zh-CN': '预览图', en: 'Preview', ja: 'プレビュー', ko: '미리보기', ru: 'Превью' },
    'detail.unknown': { 'zh-CN': '未知', en: 'Unknown', ja: '不明', ko: '알 수 없음', ru: 'Неизвестно' },
    'detail.no_desc': { 'zh-CN': '无描述', en: 'No description', ja: '説明なし', ko: '설명 없음', ru: 'Нет описания' },
    'detail.download': { 'zh-CN': '下载模组', en: 'Download', ja: 'ダウンロード', ko: '다운로드', ru: 'Скачать' },
    'detail.import': { 'zh-CN': '手动导入', en: 'Import', ja: 'インポート', ko: '가져오기', ru: 'Импорт' },
    'detail.open_local': { 'zh-CN': '打开本地', en: 'Open Local', ja: 'ローカルを開く', ko: '로컬 열기', ru: 'Открыть' },
    'detail.delete': { 'zh-CN': '删除模组', en: 'Delete', ja: '削除', ko: '삭제', ru: 'Удалить' },
    // Downloads
    'dl.active': { 'zh-CN': '正在下载', en: 'Downloading', ja: 'ダウンロード中', ko: '다운로드 중', ru: 'Загрузка' },
    'dl.queued': { 'zh-CN': '等待中', en: 'Queued', ja: '待機中', ko: '대기 중', ru: 'Очередь' },
    'dl.completed': { 'zh-CN': '已完成', en: 'Completed', ja: '完了', ko: '완료', ru: 'Завершено' },
    'dl.failed': { 'zh-CN': '下载失败', en: 'Failed', ja: '失敗', ko: '실패', ru: 'Ошибки' },
    'dl.clear_history': { 'zh-CN': '清空记录', en: 'Clear History', ja: '履歴を消去', ko: '기록 삭제', ru: 'Очистить' },
    'dl.empty': { 'zh-CN': '暂无下载任务', en: 'No downloads', ja: 'ダウンロードなし', ko: '다운로드 없음', ru: 'Нет загрузок' },
    'dl.empty_hint': { 'zh-CN': '在创意工坊中浏览模组并点击下载', en: 'Browse mods in Workshop and click download', ja: 'ワークショップでMODを探してダウンロード', ko: '창작마당에서 모드를 찾아 다운로드하세요', ru: 'Найдите моды в Мастерской и скачайте' },
    // Download status items
    'dl.status.pending': { 'zh-CN': '等待中', en: 'Pending', ja: '待機中', ko: '대기 중', ru: 'Ожидание' },
    'dl.status.downloading': { 'zh-CN': '下载中', en: 'Downloading', ja: 'ダウンロード中', ko: '다운로드 중', ru: 'Загрузка' },
    'dl.status.completed': { 'zh-CN': '已完成', en: 'Completed', ja: '完了', ko: '완료', ru: 'Завершено' },
    'dl.status.failed': { 'zh-CN': '失败', en: 'Failed', ja: '失敗', ko: '실패', ru: 'Ошибка' },
    'dl.status.cancelled': { 'zh-CN': '已取消', en: 'Cancelled', ja: 'キャンセル', ko: '취소됨', ru: 'Отменено' },
    'dl.status.extracting': { 'zh-CN': '解压中', en: 'Extracting', ja: '展開中', ko: '압축 해제 중', ru: 'Распаковка' },
    // Local
    'local.loading': { 'zh-CN': '加载中...', en: 'Loading...', ja: '読み込み中...', ko: '로딩 중...', ru: 'Загрузка...' },
    'local.empty': { 'zh-CN': '本地模组库为空', en: 'Local mod library is empty', ja: 'ローカルMODライブラリが空です', ko: '로컬 모드 라이브러리가 비어 있습니다', ru: 'Локальная библиотека пуста' },
    'local.empty_hint': { 'zh-CN': '在创意工坊下载模组，或手动导入模组压缩包', en: 'Download mods from Workshop or import archives', ja: 'ワークショップからMODをダウンロードするか、圧縮ファイルをインポートしてください', ko: '창작마당에서 모드를 다운로드하거나 압축 파일을 가져오세요', ru: 'Скачайте моды из Мастерской или импортируйте архивы' },
    'local.import': { 'zh-CN': '导入模组', en: 'Import Mod', ja: 'MODをインポート', ko: '모드 가져오기', ru: 'Импорт мода' },
    // WeGame
    'wegame.local': { 'zh-CN': '本地模组', en: 'Local Mods', ja: 'ローカルMOD', ko: '로컬 모드', ru: 'Локальные моды' },
    'wegame.installed': { 'zh-CN': 'WeGame已安装', en: 'WeGame Installed', ja: 'WeGameインストール済み', ko: 'WeGame 설치됨', ru: 'Установлено в WeGame' },
    'wegame.deploy': { 'zh-CN': '一键搬运', en: 'Deploy All', ja: '一括展開', ko: '일괄 배포', ru: 'Перенести всё' },
    'wegame.refresh': { 'zh-CN': '刷新', en: 'Refresh', ja: '更新', ko: '새로고침', ru: 'Обновить' },
    // Settings
    'settings.paths': { 'zh-CN': '路径设置', en: 'Paths', ja: 'パス設定', ko: '경로 설정', ru: 'Пути' },
    'settings.game_dir': { 'zh-CN': 'WeGame游戏目录', en: 'WeGame Game Dir', ja: 'WeGameゲームフォルダ', ko: 'WeGame 게임 폴더', ru: 'Папка игры WeGame' },
    'settings.mods_dir': { 'zh-CN': 'WeGame Mods目录', en: 'WeGame Mods Dir', ja: 'WeGame MODフォルダ', ko: 'WeGame 모드 폴더', ru: 'Папка модов WeGame' },
    'settings.download_dir': { 'zh-CN': '下载缓存目录', en: 'Download Cache', ja: 'ダウンロードキャッシュ', ko: '다운로드 캐시', ru: 'Кэш загрузок' },
    'settings.local_dir': { 'zh-CN': '本地模组库', en: 'Local Mod Library', ja: 'ローカルMODライブラリ', ko: '로컬 모드 라이브러리', ru: 'Локальная библиотека' },
    'settings.auto_detect': { 'zh-CN': '自动检测路径', en: 'Auto Detect Paths', ja: 'パスを自動検出', ko: '경로 자동 감지', ru: 'Автоопределение' },
    'settings.download': { 'zh-CN': '下载设置', en: 'Download Settings', ja: 'ダウンロード設定', ko: '다운로드 설정', ru: 'Настройки загрузок' },
    'settings.dl_source': { 'zh-CN': '首选下载源', en: 'Preferred Source', ja: '優先ダウンロード元', ko: '기본 다운로드 소스', ru: 'Источник загрузок' },
    'settings.dl_source.steam': { 'zh-CN': 'Steam CDN直连', en: 'Steam CDN Direct', ja: 'Steam CDN直結', ko: 'Steam CDN 직접', ru: 'Steam CDN' },
    'settings.dl_source.third': { 'zh-CN': '第三方下载站', en: 'Third-party', ja: 'サードパーティ', ko: '타사 사이트', ru: 'Сторонний' },
    'settings.max_threads': { 'zh-CN': '最大同时下载数', en: 'Max Concurrent Downloads', ja: '最大同時ダウンロード数', ko: '최대 동시 다운로드', ru: 'Макс. одновременных' },
    'settings.proxy': { 'zh-CN': '代理设置', en: 'Proxy', ja: 'プロキシ', ko: '프록시', ru: 'Прокси' },
    'settings.steam_api': { 'zh-CN': 'Steam API', en: 'Steam API', ja: 'Steam API', ko: 'Steam API', ru: 'Steam API' },
    'settings.apikey': { 'zh-CN': 'Steam Web API Key', en: 'Steam Web API Key', ja: 'Steam Web APIキー', ko: 'Steam Web API 키', ru: 'Ключ Steam Web API' },
    'settings.apikey_placeholder': { 'zh-CN': '粘贴 API Key，免费获取: steamcommunity.com/dev/apikey', en: 'Paste API Key, free: steamcommunity.com/dev/apikey', ja: 'APIキーを貼り付け: steamcommunity.com/dev/apikey', ko: 'API 키 붙여넣기: steamcommunity.com/dev/apikey', ru: 'Вставьте ключ: steamcommunity.com/dev/apikey'},
    'settings.apikey_hint': {
      'zh-CN': '登录 Steam 账号后访问 <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a> 免费获取，填入后即可搜索真实模组。',
      en: 'Visit <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a> after logging into Steam to get a free key.',
      ja: 'Steamにログイン後 <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a> で無料キーを取得。',
      ko: 'Steam 로그인 후 <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a>에서 무료 키 획득.',
      ru: 'Зайдите на <a href="https://steamcommunity.com/dev/apikey" target="_blank" style="color:var(--accent-cyan);">steamcommunity.com/dev/apikey</a> после входа в Steam.',
    },
    'settings.ui': { 'zh-CN': '界面设置', en: 'UI Settings', ja: 'UI設定', ko: 'UI 설정', ru: 'Интерфейс' },
    'settings.notify': { 'zh-CN': '启用下载通知', en: 'Download Notifications', ja: 'ダウンロード通知', ko: '다운로드 알림', ru: 'Уведомления' },
    'settings.auto_update': { 'zh-CN': '自动检查更新', en: 'Auto Check Updates', ja: '更新を自動確認', ko: '자동 업데이트 확인', ru: 'Автопроверка' },
    'settings.actions': { 'zh-CN': '操作', en: 'Actions', ja: '操作', ko: '작업', ru: 'Действия' },
    'settings.save': { 'zh-CN': '保存设置', en: 'Save Settings', ja: '設定を保存', ko: '설정 저장', ru: 'Сохранить' },
    'settings.reset': { 'zh-CN': '恢复默认设置', en: 'Reset to Defaults', ja: 'デフォルトに戻す', ko: '기본값으로 복원', ru: 'Сбросить' },
    // Toast / Status (JS dynamic)
    'status.ready': { 'zh-CN': '就绪', en: 'Ready', ja: '準備完了', ko: '준비됨', ru: 'Готов' },
    'toast.search.fail': { 'zh-CN': '搜索失败，请检查网络连接', en: 'Search failed, check connection', ja: '検索失敗、接続を確認', ko: '검색 실패, 연결 확인', ru: 'Ошибка поиска' },
    'toast.download.queued': { 'zh-CN': '已加入下载队列: {name}', en: 'Queued: {name}', ja: 'キューに追加: {name}', ko: '대기열에 추가됨: {name}', ru: 'В очереди: {name}' },
    'toast.download.fail': { 'zh-CN': '下载请求失败', en: 'Download request failed', ja: 'ダウンロード失敗', ko: '다운로드 실패', ru: 'Ошибка загрузки' },
    'toast.download.cancelled': { 'zh-CN': '已取消下载', en: 'Download cancelled', ja: 'ダウンロードキャンセル', ko: '다운로드 취소됨', ru: 'Загрузка отменена' },
    'toast.cancel.fail': { 'zh-CN': '取消失败', en: 'Cancel failed', ja: 'キャンセル失敗', ko: '취소 실패', ru: 'Ошибка отмены' },
    'toast.download.cleared': { 'zh-CN': '下载历史已清空', en: 'Download history cleared', ja: 'ダウンロード履歴をクリア', ko: '다운로드 기록 삭제됨', ru: 'История очищена' },
    'toast.local.load_fail': { 'zh-CN': '加载本地模组失败', en: 'Failed to load local mods', ja: 'ローカルMOD読み込み失敗', ko: '로컬 모드 로드 실패', ru: 'Ошибка загрузки локальных модов' },
    'toast.import.fail': { 'zh-CN': '导入失败', en: 'Import failed', ja: 'インポート失敗', ko: '가져오기 실패', ru: 'Ошибка импорта' },
    'toast.open_folder.fail': { 'zh-CN': '打开文件夹失败', en: 'Failed to open folder', ja: 'フォルダを開けません', ko: '폴더 열기 실패', ru: 'Ошибка открытия папки' },
    'toast.delete.fail': { 'zh-CN': '删除失败', en: 'Delete failed', ja: '削除失敗', ko: '삭제 실패', ru: 'Ошибка удаления' },
    'toast.wegame.select_first': { 'zh-CN': '请先选择要搬运的模组', en: 'Select mods to deploy first', ja: '展開するMODを選択', ko: '배포할 모드 선택', ru: 'Сначала выберите моды' },
    'toast.deploy.fail': { 'zh-CN': '搬运失败', en: 'Deploy failed', ja: '展開失敗', ko: '배포 실패', ru: 'Ошибка переноса' },
    'toast.operation.fail': { 'zh-CN': '操作失败', en: 'Operation failed', ja: '操作失敗', ko: '작업 실패', ru: 'Ошибка операции' },
    'toast.uninstall.fail': { 'zh-CN': '卸载失败', en: 'Uninstall failed', ja: 'アンインストール失敗', ko: '제거 실패', ru: 'Ошибка удаления' },
    'toast.save.fail': { 'zh-CN': '保存失败', en: 'Save failed', ja: '保存失敗', ko: '저장 실패', ru: 'Ошибка сохранения' },
    'toast.reset.fail': { 'zh-CN': '重置失败', en: 'Reset failed', ja: 'リセット失敗', ko: '초기화 실패', ru: 'Ошибка сброса' },
    'toast.path.detected': { 'zh-CN': '路径检测成功', en: 'Path detected', ja: 'パス検出成功', ko: '경로 감지됨', ru: 'Путь обнаружен' },
    'toast.path.not_detected': { 'zh-CN': '未检测到 WeGame 路径，请手动设置', en: 'WeGame path not detected, set manually', ja: 'WeGameパス未検出、手動設定してください', ko: 'WeGame 경로를 찾을 수 없음, 수동 설정', ru: 'Путь WeGame не найден, укажите вручную' },
    'toast.detect.fail': { 'zh-CN': '检测失败', en: 'Detection failed', ja: '検出失敗', ko: '감지 실패', ru: 'Ошибка обнаружения' },
    // Detail action buttons (JS dynamic)
    'detail.action.download': { 'zh-CN': '下载模组', en: 'Download', ja: 'ダウンロード', ko: '다운로드', ru: 'Скачать' },
    'detail.action.steam': { 'zh-CN': '在Steam中查看', en: 'View on Steam', ja: 'Steamで見る', ko: 'Steam에서 보기', ru: 'Открыть в Steam' },
    'detail.action.deploy': { 'zh-CN': '搬运到WeGame', en: 'Deploy to WeGame', ja: 'WeGameに展開', ko: 'WeGame으로 배포', ru: 'Перенести в WeGame' },
    'detail.action.open': { 'zh-CN': '打开文件夹', en: 'Open Folder', ja: 'フォルダを開く', ko: '폴더 열기', ru: 'Открыть папку' },
    'detail.action.delete': { 'zh-CN': '删除', en: 'Delete', ja: '削除', ko: '삭제', ru: 'Удалить' },
    'detail.action.disable': { 'zh-CN': '禁用', en: 'Disable', ja: '無効化', ko: '비활성화', ru: 'Отключить' },
    'detail.action.enable': { 'zh-CN': '启用', en: 'Enable', ja: '有効化', ko: '활성화', ru: 'Включить' },
    'detail.action.uninstall': { 'zh-CN': '卸载', en: 'Uninstall', ja: 'アンインストール', ko: '제거', ru: 'Удалить' },
    // Generic
    'gen.cancel': { 'zh-CN': '取消', en: 'Cancel', ja: 'キャンセル', ko: '취소', ru: 'Отмена' },
    'gen.confirm': { 'zh-CN': '确认', en: 'Confirm', ja: '確認', ko: '확인', ru: 'Подтвердить' },
    // Badges / other
    'badge.local': { 'zh-CN': '已下载', en: 'Downloaded', ja: 'DL済', ko: '다운로드됨', ru: 'Скачано' },
  };

  function getLocale() {
    return localStorage.getItem(I18N_KEY) || 'zh-CN';
  }

  function setLocale(loc) {
    localStorage.setItem(I18N_KEY, loc);
    applyTranslations();
  }

  function t(key, vars) {
    const locale = getLocale();
    const entry = T[key];
    if (!entry) return key;
    let str = entry[locale] || entry['zh-CN'] || key;
    if (vars) {
      Object.keys(vars).forEach(k => {
        str = str.replace('{' + k + '}', vars[k]);
      });
    }
    return str;
  }

  function applyTranslations() {
    // data-i18n on element textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const str = t(key);
      if (str !== undefined) el.textContent = str;
    });
    // data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const str = t(key);
      if (str !== undefined) el.placeholder = str;
    });
    // data-i18n-value for option/button values
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      const key = el.getAttribute('data-i18n-value');
      const str = t(key);
      if (str !== undefined) el.value = str;
    });
    // data-i18n-html for innerHTML (used for API key banner etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const str = t(key);
      if (str !== undefined) el.innerHTML = str;
    });
  }

  // Create language switcher button in sidebar footer
  function createSwitcher() {
    const sidebar = document.querySelector('.sidebar-footer');
    if (!sidebar) return;

    const container = document.createElement('div');
    container.className = 'lang-switcher';
    container.title = 'Change Language / 切换语言';

    const currentLocale = getLocale();
    const currentLang = LANGUAGES[currentLocale] || LANGUAGES['zh-CN'];

    const btn = document.createElement('button');
    btn.className = 'lang-switcher-btn';
    btn.textContent = currentLang.flag + ' ' + currentLang.label;
    btn.onclick = function () {
      showLangMenu(btn, container);
    };

    container.appendChild(btn);
    sidebar.appendChild(container);
  }

  function showLangMenu(btn, container) {
    // Remove any existing menu
    const existing = document.querySelector('.lang-menu');
    if (existing) { existing.remove(); return; }

    const menu = document.createElement('div');
    menu.className = 'lang-menu';

    const current = getLocale();
    Object.entries(LANGUAGES).forEach(([code, info]) => {
      const item = document.createElement('div');
      item.className = 'lang-menu-item' + (code === current ? ' active' : '');
      item.textContent = info.flag + ' ' + info.label;
      item.onclick = function () {
        setLocale(code);
        menu.remove();
        btn.textContent = info.flag + ' ' + info.label;
      };
      menu.appendChild(item);
    });

    container.appendChild(menu);

    // Click outside to close
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!menu.contains(e.target) && e.target !== btn) {
          menu.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      createSwitcher();
      applyTranslations();
    });
  } else {
    createSwitcher();
    applyTranslations();
  }

  // Expose globally
  window.__i18n = { t, getLocale, setLocale, applyTranslations };

})();
