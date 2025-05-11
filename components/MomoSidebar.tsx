import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

interface MomoSidebarProps {
  onOpenCharacterList: () => void;
  onOpenGroupChatList: () => void;
}

const MomoSidebar: React.FC<MomoSidebarProps> = ({
  onOpenCharacterList,
  onOpenGroupChatList,
}) => {
  const router = useRouter();

  const testScript = `
타이틀 : 용사 아리스, 선도부 체험 퀘스트!
아리스(게임개발부) : 빠밤! 아리스, 게헨나 선도부에 용사 체험을 하러 왔습니다! 히나 선배, 잘 부탁드립니다! [emotion : aris_bigsmile.png, bg : BG_CommitteeRoom.jpg, music : mischievous_step.mp3]
히나(선도부) : ...하아. 그래, 텐도 아리스. 갑자기 찾아와서 선도부 체험을 하고 싶다니, 무슨 바람이 분 건지는 모르겠지만. [emotion : hina_expressionless.png]
히나(선도부) : 일단 말해두지만, 선도부 일은 게임이 아니야. 장난으로 할 생각이라면 지금 돌아가는 게 좋아. [emotion : hina_serious.png]
아리스(게임개발부) : 아닙니다! 아리스는 진심입니다! 선도부의 정의로운 활동은 용사의 길과 통한다고 생각합니다! 레벨 업의 기회입니다! [emotion : aris_brave.png]
히나(선도부) : ...레벨 업이라니. 아무튼, 오늘 하루 동안 내 지시에 잘 따라줘야 해. 알겠어? [emotion : hina_upset.png]
아리스(게임개발부) : 네, 히나 대장님! 퀘스트 수락! 아리스, 최선을 다하겠습니다! [emotion : aris_smile.png]
narration : (히나는 깊은 한숨을 내쉬고는 아리스에게 선도부 완장을 채워주었다.) [bg : BG_CommitteeRoom.jpg, sound : SE_Confirm_01.mp3]
히나(선도부) : 그럼, 먼저 교내 순찰부터 시작한다. 따라와. [emotion : hina_expressionless.png, music : unwelcome_school.mp3]
deleteAll
waitSecond = 1
narration : (아리스는 의욕 넘치는 발걸음으로 히나의 뒤를 따랐다. 게헨나 학원의 복도는 여전히 소란스러웠다.) [bg : BG_GehennaCampus.jpg, music : unwelcome_school.mp3]
아리스(게임개발부) : 히나 선배, 저기 복도에서 뛰어다니는 학생들이 보입니다! 일종의 몬스터 출현입니까? HP를 깎아야 할까요? [emotion : aris_awkward.png]
히나(선도부) : ...그냥 뛰는 것뿐이야. 주의만 주면 돼. "복도에서는 뛰지 마라." 이렇게. [emotion : hina_serious.png]
아리스(게임개발부) : 알겠습니다! "복도에서는 뛰지 마시오, 미니언들이여! 용사의 앞길을 막는다면 경험치로 만들어주겠노라!" [emotion : aris_brave.png, animation : shakeX]
히나(선도부) : 하아... 그냥 조용히 주의만 주라고 했을 텐데. 그리고 미니언이 아니라 그냥 학생이야. [emotion : hina_sweating.png, expression : question_mark.png]
narration : (그때, 저편에서 불량학생 몇몇이 소란을 피우는 것이 보였다. 확실히 '이벤트 몬스터' 같은 분위기였다.) [bg : BG_GehennaStreet.jpg, music : crossfire.mp3]
스케반 : 뭐냐, 선도부냐? 우리가 뭘 하든 네놈들이 상관할 바 아니잖아! [emotion : sukeban_thug_smg_angry.png]
아리스(게임개발부) : 빠밤! 드디어 중간 보스 등장입니다! 히나 선배, 저 악당들은 아리스가 처리하겠습니다! 빛이여! 아리스의 필살기, '레일건 Mk.I' 발사 준비! [emotion : aris_very_angry.png, sound : SE_Beep_01.mp3]
히나(선도부) : 잠깐, 텐도 아리스! 그 무기는 또 뭐야! 그런 건 필요 없어! [emotion : hina_shout.png, animation : shakeY]
히나(선도부) : 너희들, 여기서 소란 피우지 말고 당장 흩어져. 내 말이 말 같지 않나? [emotion : hina_angry.png]
narration : (히나가 차갑게 말하자, 불량학생들은 히나의 악명을 떠올렸는지 슬금슬금 도망쳤다.) [bg : BG_GehennaStreet.jpg, sound : SE_Denied_01.mp3]
스케반 : 쳇, 오늘은 운이 없었군! 두고 보자! [emotion : sukeban_thug_smg_uncomfortable.png]
아리스(게임개발부) : 와아! 히나 선배, 정말 대단합니다! 눈빛만으로 강력한 보스 몬스터를 퇴치하다니! 역시 최종 레벨 용사는 다릅니다! [emotion : aris_impressive.png]
히나(선도부) : ...보스가 아니라 그냥 좀 시끄러운 녀석들이었을 뿐이야. 그리고 매번 저렇게 쉽게 해결되는 것도 아니고. [emotion : hina_expressionless.png, music : unwelcome_school.mp3]
아리스(게임개발부) : 그래도 아리스, 뭔가 도움이 되고 싶습니다! 다음 퀘스트는 무엇입니까? 혹시 강력한 아이템 파밍 지역이라도 있습니까? [emotion : aris_smile2.png]
히나(선도부) : ...다음은 서류 작업이다. 사무실로 돌아가지. [emotion : hina_closingeyes.png]
deleteAll
waitSecond = 1
narration : (선도부 사무실은 산더미 같은 서류로 가득했다. 히나는 익숙하게 자리에 앉아 서류를 처리하기 시작했다.) [bg : BG_CommitteeRoom.jpg, music : morose_dreamer.mp3]
히나(선도부) : 텐도 아리스, 너는 저기 있는 보고서들을 날짜순으로 정리해. 간단한 작업이니 할 수 있겠지. [emotion : hina_serious.png]
아리스(게임개발부) : 빠밤! '문서 정리 퀘스트'로군요! 아리스, 이 정도는 식은 죽 먹기입니다! 경험치를 대량 획득하겠습니다! [emotion : aris_brave.png]
narration : (아리스는 의욕적으로 서류 더미에 달려들었다. 하지만 잠시 후, 아리스의 표정이 점점 심각해졌다.) [bg : BG_CommitteeRoom.jpg]
아리스(게임개발부) : 으음... 히나 선배, 이 문서들은 암호 해독 스킬이 필요한 것 같습니다. 아리스의 현재 스탯으로는 해독이 불가능합니다. 혹시 해독 스크롤 아이템이 있습니까? [emotion : aris_difficult.png, expression : question_mark.png]
히나(선도부) : ...그냥 날짜만 보면 되는 건데. 암호 같은 건 없어. [emotion : hina_upset.png]
아리스(게임개발부) : 앗! 그렇습니까? 아리스, 숨겨진 함정인 줄 알았습니다! 역시 선도부의 퀘스트는 심오합니다! [emotion : aris_awkward.png]
narration : (몇 시간이 흘렀을까. 히나는 여전히 서류와 씨름 중이었고, 아리스는 간신히 문서 정리를 마친 듯 보였다. 하지만 어딘가 이상했다.) [bg : BG_CommitteeRoom.jpg, music : morose_dreamer.mp3]
히나(선도부) : ...텐도 아리스, 다 됐나? 그런데 그건... [emotion : hina_makebigeyes.png]
narration : (아리스는 서류들을 색깔별로, 그리고 이상한 기호 모양으로 분류해 탑처럼 쌓아놓고 있었다.) [bg : BG_CommitteeRoom.jpg]
아리스(게임개발부) : 네, 히나 선배! 아리스, 새로운 분류법을 개발했습니다! '용사 아리스식 효율적 문서 정리 마법진'입니다! 이 마법진은 문서에 담긴 에너지를 증폭시켜 업무 효율을 극대화합니다! 빠밤! [emotion : aris_bigsmile.png]
히나(선도부) : ............하아.................. [emotion : hina_sweating.png, animation : shakeY]
히나(선도부) : 오늘은... 이만하면 됐다. 체험은 여기까지 하지. 수고했다, 텐도 아리스. 정말로... 수고 많았어. [emotion : hina_closingeyes.png]
아리스(게임개발부) : 앗! 벌써 퀘스트 완료입니까? 아리스, 많은 경험치를 얻은 것 같습니다! 히나 선배, 오늘 정말 즐거웠습니다! 다음에 또 다른 퀘스트를 주십시오! [emotion : aris_smile_with_tear.png]
히나(선도부) : ...그래. 다음은... 한 1년 뒤쯤에 생각해 보지. [emotion : hina_weaksmile.png]
deleteAll
waitSecond = 2
narration : (아리스는 씩씩하게 경례를 하고 선도부실을 나섰다. 히나는 홀로 남아 책상에 엎드렸다. 평소보다 두 배는 더 피곤해 보였다.) [music : none]
히나(선도부) : ...그래도... 이상하게 활기차긴 했네. 아주 조금은... [emotion : hina_weaksmile2.png]
endEvent
  `.trim();

  return (
    <View style={styles.sidebar}>
      {/* 캐릭터 리스트 복귀 버튼 */}
      <TouchableOpacity
        onPress={onOpenCharacterList}
        style={styles.iconBtn}
      >
        <Image
          source={require('../assets/images/list.jpg')}
          style={styles.icon}
        />
      </TouchableOpacity>

      {/* 메시지 아이콘 → 단톡방 리스트로 진입 */}
      <TouchableOpacity
        onPress={onOpenGroupChatList}
        style={styles.iconBtn}
      >
        <Image
          source={require('../assets/images/message.jpg')}
          style={styles.icon}
        />
      </TouchableOpacity>

      {/* 이벤트 테스트 버튼 */}
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/event-screen',
            params: { script: testScript },
          });
        }}
        style={styles.testBtn}
      >
        <Text style={styles.testText}>🎬</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MomoSidebar;

const styles = StyleSheet.create({
  sidebar: {
    width: 60,
    backgroundColor: '#4C5B70',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBtn: {
    marginBottom: 12,
    padding: 6,
    borderRadius: 6,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  testBtn: {
    padding: 6,
    borderRadius: 6,
  },
  testText: {
    fontSize: 25,
    color: 'white',
    fontWeight: 'bold',
  },
});
