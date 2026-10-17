import React, { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { getAppLanguage, subscribeAppLanguage } from '@/services/appLanguage';
import type { AppLanguage } from '@/storage/types';

type Dictionary = Record<string, string>;

const translations: Record<AppLanguage, Dictionary> = {
  ko: {
    storySearchMode: '검색 범위', searchByTitle: '제목', searchByContent: '내용', storySearchPlaceholder: '검색어 입력', searchStoryTitle: '제목 검색', searchStoryContent: '내용 검색',
    searchStories: '제목이나 내용으로 검색', clearStorySearch: '검색어 지우기', noStorySearchResults: '검색 결과가 없습니다.', storySearchCount: '전체 {total}개 중 {count}개',
    chatSize: '채팅 크기', decreaseChatSize: '채팅 크기 줄이기', increaseChatSize: '채팅 크기 키우기', resetChatSize: '기본 크기', chatSizeHint: '80~150%로 조절할 수 있습니다. 일반 채팅과 저장된 대화에 적용되며 자동 저장됩니다.', chatPreviewCharacter: '선생, 오늘은 무슨 일이야?', chatPreviewUser: '잠깐 이야기하러 왔어!',
    createStory: '새로 만들기', emptyDraft: '스토리 대본을 입력해 주세요.',
    noSavedChat: '이 스토리에는 저장된 대화 내역이 없습니다.', savedChatReadOnly: '저장된 대화입니다. 메시지를 보낼 수 없습니다.', chatReplayHint: '대화를 재생하고 있습니다. 화면을 누르면 전체 대화를 표시합니다.', showAllChat: '전체 대화 보기',
    language: '언어', settings: '설정', sound: '사운드', bgm: 'BGM 볼륨', sfx: '효과음 볼륨', volumeHint: '스토리 안에서 바꾼 볼륨과 같습니다.',
    guide: '안내', howToUse: '사용 방법', terms: '이용 약관',
    apiKey: 'Gemini API 키', apiKeyPlaceholder: '본인 키를 입력하세요', save: '저장', rememberKey: 'API 키 기억하기', keySaved: '이 기기에만 저장됩니다. 다른 사람과 공유하지 마세요.', keySession: '이번 실행에서만 사용합니다.', keyRequired: '대화와 스토리 생성에 이 키를 사용합니다.',
    greetFirst: '먼저 말 걸기', greetOn: '방에 들어가면 먼저 말을 겁니다.', greetOff: '꺼 두면 먼저 말을 걸지 않습니다.', selectCharacter: '대화할 상대를 선택하세요.',
    messagePlaceholder: '메시지를 입력하세요', messageKeyRequired: '설정에서 API 키를 입력해 주세요', send: '보내기', bondEvent: '인연 이벤트', bondStory: '{name}의 인연 스토리로',
    library: '라이브러리', copyPrompt: '프롬프트 복사', load: '불러오기', editStory: '스토리 수정', assets: '사용 가능 에셋', cancel: '취소', emptyStories: '저장된 스토리가 없습니다.', storyMenu: '스토리 관리', deleteQuestion: '지울까요?', delete: '삭제', edit: '수정', export: '추출',
    promptCopied: '프롬프트를 복사했습니다.', copyFailed: '복사에 실패했습니다.', emptyFile: '파일에 대본이 없습니다.',
    assetHint: '커서 앞에 [ 가 있을 때만 넣습니다. 같은 항목이 있으면 바꿉니다.', audioHint: ' 이름에 올리면 들립니다.', searchName: '이름 검색', previewAsset: '에셋 미리보기', noBackgroundMusic: '배경 음악 없음', playingPreview: '오디오 미리보기를 재생하고 있어요.', tapOutside: '바깥을 누르면 미리보기를 닫습니다.', background: '배경', emotion: '표정', music: '음악', soundEffect: '효과음', effect: '연출',
    soundSettings: '사운드 설정', soundSettingsHint: '배경 음악과 효과음 볼륨을 조절합니다.', close: '닫기', mute: '음소거', unmute: '음소거 해제', exitEvent: '이벤트 나가기', nextLine: '다음 대사',
    termsTitle: '이용 약관', tutorialTitle: '사용 방법', agreeTerms: '위 내용을 확인했고, 이에 동의합니다.', agreeStart: '동의하고 시작', skip: '건너뛰기', previous: '이전', start: '시작하기', next: '다음', openAiStudio: 'Google AI Studio 열기',
  },
  en: {
    storySearchMode: 'Search in', searchByTitle: 'Title', searchByContent: 'Content', storySearchPlaceholder: 'Search', searchStoryTitle: 'Search titles', searchStoryContent: 'Search content',
    searchStories: 'Search titles or content', clearStorySearch: 'Clear search', noStorySearchResults: 'No matching stories.', storySearchCount: '{count} of {total} stories',
    chatSize: 'Chat size', decreaseChatSize: 'Decrease chat size', increaseChatSize: 'Increase chat size', resetChatSize: 'Default size', chatSizeHint: 'Adjust from 80% to 150%. Applies to live and saved chats and saves automatically.', chatPreviewCharacter: 'Sensei, what brings you here today?', chatPreviewUser: 'Just came to chat!',
    createStory: 'Create new', emptyDraft: 'Enter a story script.',
    noSavedChat: 'This story has no saved chat history.', savedChatReadOnly: 'Saved conversation. Messages cannot be sent.', chatReplayHint: 'Playing conversation. Tap to show all messages.', showAllChat: 'Show all messages',
    language: 'Language', settings: 'Settings', sound: 'Sound', bgm: 'BGM volume', sfx: 'Sound effects volume', volumeHint: 'Matches the volume used in stories.',
    guide: 'Help', howToUse: 'How to use', terms: 'Terms of use',
    apiKey: 'Gemini API key', apiKeyPlaceholder: 'Enter your API key', save: 'Save', rememberKey: 'Remember API key', keySaved: 'Saved only on this device. Do not share it.', keySession: 'Used only for this session.', keyRequired: 'This key is used for chat and story generation.',
    greetFirst: 'Start the conversation', greetOn: 'The character speaks first when you enter.', greetOff: 'Characters will not speak first.', selectCharacter: 'Choose someone to chat with.',
    messagePlaceholder: 'Type a message', messageKeyRequired: 'Enter an API key in Settings', send: 'Send', bondEvent: 'Bond event', bondStory: "{name}'s bond story",
    library: 'Library', copyPrompt: 'Copy prompt', load: 'Import', editStory: 'Edit story', assets: 'Available assets', cancel: 'Cancel', emptyStories: 'No saved stories.', storyMenu: 'Manage story', deleteQuestion: 'Delete this story?', delete: 'Delete', edit: 'Edit', export: 'Export',
    promptCopied: 'Prompt copied.', copyFailed: 'Could not copy the prompt.', emptyFile: 'This file has no script.',
    assetHint: 'Insert only when the cursor follows [. Existing fields are replaced.', audioHint: ' Hover a name to listen.', searchName: 'Search names', previewAsset: 'Asset preview', noBackgroundMusic: 'No background music', playingPreview: 'Playing an audio preview.', tapOutside: 'Tap outside to close the preview.', background: 'Background', emotion: 'Expression', music: 'Music', soundEffect: 'Sound effect', effect: 'Effect',
    soundSettings: 'Sound settings', soundSettingsHint: 'Adjust background music and sound effects.', close: 'Close', mute: 'Mute', unmute: 'Unmute', exitEvent: 'Exit event', nextLine: 'Next line',
    termsTitle: 'Terms of use', tutorialTitle: 'How to use', agreeTerms: 'I have read and agree to the above.', agreeStart: 'Agree and start', skip: 'Skip', previous: 'Previous', start: 'Start', next: 'Next', openAiStudio: 'Open Google AI Studio',
  },
  ja: {
    storySearchMode: '検索範囲', searchByTitle: 'タイトル', searchByContent: '内容', storySearchPlaceholder: '検索語を入力', searchStoryTitle: 'タイトルを検索', searchStoryContent: '内容を検索',
    searchStories: 'タイトルや内容で検索', clearStorySearch: '検索をクリア', noStorySearchResults: '検索結果がありません。', storySearchCount: '全{total}件中{count}件',
    chatSize: 'チャットの大きさ', decreaseChatSize: 'チャットを小さくする', increaseChatSize: 'チャットを大きくする', resetChatSize: '標準サイズ', chatSizeHint: '80〜150%で調整できます。通常・保存済みの会話に適用され、自動保存されます。', chatPreviewCharacter: '先生、今日はどうしたの？', chatPreviewUser: 'ちょっと話しに来たよ！',
    createStory: '新規作成', emptyDraft: 'ストーリーの台本を入力してください。',
    noSavedChat: 'このストーリーには保存された会話がありません。', savedChatReadOnly: '保存された会話です。メッセージは送信できません。', chatReplayHint: '会話を再生中です。タップするとすべて表示します。', showAllChat: '会話をすべて表示',
    language: '言語', settings: '設定', sound: 'サウンド', bgm: 'BGM音量', sfx: '効果音の音量', volumeHint: 'ストーリー内の音量設定と共通です。',
    guide: 'ガイド', howToUse: '使い方', terms: '利用規約',
    apiKey: 'Gemini API キー', apiKeyPlaceholder: 'API キーを入力', save: '保存', rememberKey: 'API キーを記憶する', keySaved: 'この端末にのみ保存されます。共有しないでください。', keySession: '今回の実行中のみ使用します。', keyRequired: 'チャットとストーリー生成にこのキーを使います。',
    greetFirst: '先に話しかける', greetOn: '入室時にキャラクターから話しかけます。', greetOff: 'キャラクターから先に話しかけません。', selectCharacter: '会話する相手を選んでください。',
    messagePlaceholder: 'メッセージを入力', messageKeyRequired: '設定で API キーを入力してください', send: '送信', bondEvent: '絆イベント', bondStory: '{name}の絆ストーリーへ',
    library: 'ライブラリ', copyPrompt: 'プロンプトをコピー', load: '読み込む', editStory: 'ストーリーを編集', assets: '使用可能なアセット', cancel: 'キャンセル', emptyStories: '保存されたストーリーはありません。', storyMenu: 'ストーリーを管理', deleteQuestion: '削除しますか？', delete: '削除', edit: '編集', export: '書き出す',
    promptCopied: 'プロンプトをコピーしました。', copyFailed: 'コピーに失敗しました。', emptyFile: 'ファイルに台本がありません。',
    assetHint: 'カーソルの前に [ がある時だけ追加できます。同じ項目は置き換えます。', audioHint: ' 名前に重ねると再生されます。', searchName: '名前を検索', previewAsset: 'アセットプレビュー', noBackgroundMusic: 'BGMなし', playingPreview: 'オーディオプレビューを再生しています。', tapOutside: '外側をタップすると閉じます。', background: '背景', emotion: '表情', music: '音楽', soundEffect: '効果音', effect: '演出',
    soundSettings: 'サウンド設定', soundSettingsHint: 'BGMと効果音の音量を調整します。', close: '閉じる', mute: 'ミュート', unmute: 'ミュート解除', exitEvent: 'イベントを終了', nextLine: '次のセリフ',
    termsTitle: '利用規約', tutorialTitle: '使い方', agreeTerms: '上記を確認し、同意します。', agreeStart: '同意して始める', skip: 'スキップ', previous: '戻る', start: '始める', next: '次へ', openAiStudio: 'Google AI Studio を開く',
  },
  zh: {
    storySearchMode: '搜索范围', searchByTitle: '标题', searchByContent: '内容', storySearchPlaceholder: '输入关键词', searchStoryTitle: '搜索标题', searchStoryContent: '搜索内容',
    searchStories: '按标题或内容搜索', clearStorySearch: '清除搜索', noStorySearchResults: '没有搜索结果。', storySearchCount: '共{total}篇，找到{count}篇',
    chatSize: '聊天大小', decreaseChatSize: '缩小聊天', increaseChatSize: '放大聊天', resetChatSize: '默认大小', chatSizeHint: '可在80%至150%之间调整。适用于实时和已保存的对话，并自动保存。', chatPreviewCharacter: '老师，今天有什么事？', chatPreviewUser: '来聊聊天！',
    createStory: '新建', emptyDraft: '请输入故事剧本。',
    noSavedChat: '此故事没有保存的聊天记录。', savedChatReadOnly: '已保存的对话，无法发送消息。', chatReplayHint: '正在播放对话，点击屏幕显示全部消息。', showAllChat: '显示全部对话',
    language: '语言', settings: '设置', sound: '声音', bgm: '背景音乐音量', sfx: '音效音量', volumeHint: '与故事中的音量设置相同。',
    guide: '帮助', howToUse: '使用方法', terms: '使用条款',
    apiKey: 'Gemini API 密钥', apiKeyPlaceholder: '输入您的 API 密钥', save: '保存', rememberKey: '记住 API 密钥', keySaved: '仅保存在此设备上，请勿分享。', keySession: '仅在本次运行中使用。', keyRequired: '此密钥用于聊天和生成故事。',
    greetFirst: '主动开场', greetOn: '进入时角色会先开口。', greetOff: '角色不会主动开口。', selectCharacter: '请选择聊天对象。',
    messagePlaceholder: '输入消息', messageKeyRequired: '请在设置中输入 API 密钥', send: '发送', bondEvent: '羁绊事件', bondStory: '进入{name}的羁绊故事',
    library: '资料库', copyPrompt: '复制提示词', load: '导入', editStory: '编辑故事', assets: '可用资源', cancel: '取消', emptyStories: '没有已保存的故事。', storyMenu: '管理故事', deleteQuestion: '要删除吗？', delete: '删除', edit: '编辑', export: '导出',
    promptCopied: '已复制提示词。', copyFailed: '复制失败。', emptyFile: '文件中没有剧本。',
    assetHint: '只有光标前有 [ 时才能插入。相同项目会被替换。', audioHint: ' 悬停名称即可试听。', searchName: '搜索名称', previewAsset: '资源预览', noBackgroundMusic: '无背景音乐', playingPreview: '正在播放音频预览。', tapOutside: '点击外侧关闭预览。', background: '背景', emotion: '表情', music: '音乐', soundEffect: '音效', effect: '演出',
    soundSettings: '声音设置', soundSettingsHint: '调整背景音乐和音效音量。', close: '关闭', mute: '静音', unmute: '取消静音', exitEvent: '退出事件', nextLine: '下一句',
    termsTitle: '使用条款', tutorialTitle: '使用方法', agreeTerms: '我已阅读并同意以上内容。', agreeStart: '同意并开始', skip: '跳过', previous: '上一步', start: '开始', next: '下一步', openAiStudio: '打开 Google AI Studio',
  },
};

type I18nValue = { language: AppLanguage; t: (key: string, values?: Record<string, string | number>) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribeAppLanguage, getAppLanguage, () => 'ko');
  const t = useCallback((key: string, values?: Record<string, string | number>) => {
    let text = translations[language][key] ?? translations.ko[key] ?? key;
    for (const [name, value] of Object.entries(values ?? {})) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  }, [language]);
  const value = useMemo(() => ({ language, t }), [language, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
