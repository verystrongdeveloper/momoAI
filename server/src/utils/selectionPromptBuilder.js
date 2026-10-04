// src/utils/selectionPromptBuilder.js

const { getAvailableCharacters } = require('./characterList');
// const { prompts, resources } = require('../config/prompts'); // resources는 여기서 필요 없어짐.

/**
 * 최근 3쌍 대화를 기반으로 등장 인물 선정 프롬프트를 만든다.
 * @typedef {{user:string, ai:string}} DialogPair
 * @param  {DialogPair[]} dialogHistory
 * @returns {string}
 */
function buildSelectionPrompt(dialogHistory) {
    const charList = getAvailableCharacters();

    const historyTXT = dialogHistory
        .map(
            (d, i) =>
                `(${i + 1}) 선생: "${d.user}"\n    캐릭터: "${d.ai}"`
        )
        .join('\n');

    // ★ 변경: 각 캐릭터별 사용 가능한 emotion 리스트를 프롬프트에 포함하지 않음
    // const charResourcesInfo = charList.map(charName => {
    //     const charEmotions = resources[charName]?.emotions || [];
    //     return `  - ${charName} 사용 가능 emotion: ${charEmotions.join(', ')}`;
    // }).join('\n');


    return `[등장 인물 선정]
    아래는 선생과 메인 캐릭터의 최근 3쌍 대화입니다.
    ${historyTXT}
    이벤트에 등장할 **추가 인물은 최대 2명까지만** 골라주세요. **무작정 등장시키지 말고**, 대화에 명확한 관련이 있는 인물만 골라야 합니다.
    같은 소속이라고 해서 무조건 출연시킬 필요는 없습니다. 예를 들어 호시노와 시로코는 같은 대책위원회 소속이지만, 최근 대화 3쌍에서 시로코를 출연시킬 필요가 없으면 출연시키지 마세요.
    예를 들어서
    "히나는 호시노와 함께 바다에 가기로 약속되었고, 세리카는 아비도스 대책위원회 멤버이므로 자연스럽게 등장할 수 있음." 이딴 쓰레기같은 reason을 만들지 마세요. 갑자기 세리카가 왜 쳐 등장합니까?
    현재 등장 가능한 인물 목록은 다음과 같은데 여기에서만 골라야합니다. 아직 여기 없는 캐릭터를 고르는 병신같은 짓은 하지 않길 바랍니다.: ${charList.join(', ')} (예를 들어 나기사는 현재 캐릭터 리스트에 존재하지 않습니다.)
    
    
    주의사항
    - 등장인물은 **메인 캐릭터 외에 많아도 2명까지만** 포함해야 합니다.
    - **'혹시 나올 법한 인물'이라도 근거가 없으면 넣지 마세요.**
    - **이벤트의 초점은 메인 캐릭터**에 있어야 하며, 다른 인물은 **보조 역할**이어야 합니다.
    - 너무 많은 인물을 추가하는 것은 뇌절입니다. 절대 금지입니다.
    - 참고로 아야네는 아직 프롬프팅 하지 않은 관계로 출연시키지 마세요.
    
    ★ 중요: 이제는 이모션 파일명 목록을 여기서 참조할 필요가 없습니다. (eventController에서 동적으로 가져옵니다.)
    
    출력 형식 (JSON만! 설명 불필요):
    {
      "characters": [
    { "name": "이름1" }, 
    { "name": "이름2" }  
  ],
      "reason": "이 인물들이 왜 등장하는지 간결하게",
      "direction": "이야기의 시작, 주요 전개 상황, 감정 변화, 마무리까지 자연스럽게 이어지는 시놉시스를 3~4문장 정도로 작성해 주세요. 400자 이내면 적당합니다."
    }
    
    JSON ONLY:
    `;

}

module.exports = { buildSelectionPrompt };