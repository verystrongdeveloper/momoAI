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
타이틀 : 비밀스러운 책과 정의의 대혼란
narration : (따뜻한 오후의 트리니티 교정. 저 멀리 보충수업부 학생들이 재잘거리며 지나간다. 코하루도 그 사이에 섞여 바쁘게 걸어가고 있었다. 그녀의 가방에서 무언가 살짝 삐져나와 있었다.) [bg : BG_Campus.jpg, music : lovely_picnic.mp3]
narration : (그때, 코하루가 미처 챙기지 못한 듯, 표지부터 어딘가 수상쩍은 분위기를 풍기는 책 한 권이 바닥에 툭 떨어졌다. 일행은 이미 멀어져 가고 있었다.) [sound : SE_Book_02.mp3]
narration : (그 순간, 근처를 순찰 중이던 정의실현부의 츠루기가 떨어진 책을 발견했다.) [bg : BG_Campus.jpg]
츠루기(정의실현부) : 음? 이건... 학생의 분실물인가. (표지를 슬쩍 보더니 미간을 찌푸린다) ...내용물이 좀 수상해 보이는데. [emotion : tsurugi_curious.png]
narration : (츠루기는 책을 집어 들고는, 코하루가 속한 무리를 바라보았다. 즐겁게 이야기하는 그들을 잠시 보더니, 이내 고개를 살짝 저었다.)
츠루기(정의실현부) : (혼잣말로) ...지금은 즐거운 시간을 보내고 있는 듯하군. 일단 내가 보관했다가 나중에 확인 후 돌려주도록 하자. 혹시라도 불건전한 물건이라면 즉시 처리해야 하니. [emotion : tsurugi_serious.png]
deleteAll
waitSecond = 2
narration : (그렇게 츠루기는 '의심스러운' 책을 들고 자신의 숙소로 돌아갔다.) [bg : BG_Dormitory.jpg, music : shady_girls.mp3]
narration : (츠루기는 책상 위에 코하루의 책을 올려두고, 먼저 그 내용을 살펴보기로 했다. 정의실현부 부장으로서 학생의 물건이라도 유해한 것이라면 간과할 수 없었기 때문이다.)
narration : (사르르륵- 츠루기가 조심스럽게 책장을 넘기자마자, 그녀의 눈이 믿을 수 없다는 듯 휘둥그레졌다.) [sound : SE_BushRusting_02b.mp3]
츠루기(정의실현부) : 이, 이, 이것은...! 단순한 풍기문란을 넘어선...! 이런 파렴치한 그림과 글자들이 버젓이! [emotion : tsurugi_shock.png, expression : sweat.png, animation : shakeX]
narration : (츠루기의 얼굴은 순식간에 새빨갛게 달아올랐고, 온몸을 부르르 떨기 시작했다. 마치 엄청난 충격이라도 받은 듯 보였다.)
츠루기(정의실현부) : 갸아아아아악!! 안 돼! 어떻게 이런 음란하고 해괴한 것을 학생이, 그것도 코하루 학생이...! 정의가! 정의가 용납 못 한다! [emotion : tsurugi_embarrassed2.png, animation : shakeY]
narration : (극도의 혼란과 분노, 그리고 알 수 없는 감정에 휩싸인 츠루기는 방 안을 이리저리 날뛰며 허둥대다 그만 책 위로 격렬하게 풀썩 넘어지고 말았다!) [sound : SE_Boom_01.mp3]
narration : (그 결과, 코하루의 '매우 소중한 비밀 책'은 산산조각이 나 버렸다.)
츠루기(정의실현부) : 아... 아아... 내, 내가 무슨 짓을... 책이... 정의를 집행하려다가 그만...! [emotion : tsurugi_awkward.png]
deleteAll
waitSecond = 2
narration : (다음 날 아침, 정의실현부실 앞에서 츠루기가 거의 반쯤 넋이 나간 채 코하루를 기다리고 있었다. 그녀의 손에는 테이프로 처참하게 수습된, 원래 형태를 알아보기 힘든 책이 들려 있었다.) [bg : BG_Campus.jpg, music : mischievous_step.mp3]
코하루(보충수업부) : 어, 츠루기 선배? 저한테 무슨 볼일이라도... 안색이 안 좋으신데요. [emotion : koharu_default.png]
츠루기(정의실현부) : 코하루 학생! 그, 어제... 네놈이 떨어뜨린 이... 이 물건을... 내가, 내가 그만...! 크흐흑...! [emotion : tsurugi_embarrassed.png, animation : shakeX]
narration : (츠루기는 거의 울먹이며 엉망진창이 된 책을 내밀었다. 코하루는 책의 상태를 보자마자 얼굴이 하얗게 질렸다.)
코하루(보충수업부) : 에에에엣?! 이게 뭐예요! 내... 내 보물 1호가! 아니, 이 책이 왜! 왜 이렇게 된 거예요?! 사형이야, 이런 짓 한 녀석은!! [emotion : koharu_shout2.png, expression : question_mark.png]
츠루기(정의실현부) : 미, 미안하다! 정말 면목 없다! 내가... 내가 흥분해서 그만...! 어떤 벌이라도 달게 받겠다! [emotion : tsurugi_awkward.png]
코하루(보충수업부) : 아, 아뇨! 괜찮아요! 어, 어차피 그거... 그... 정의실현부에서 '압수'한 풍기문란한 책이니까요! 네! 전 진짜, 정말로, 하나도 안 아까워요! 하하하! (하지만 눈에는 이미 눈물이 그렁그렁 맺혀 있었다.) [emotion : koharu_embarrassed.png]
narration : (코하루는 황급히 손사래를 쳤지만, 목소리는 떨리고 있었고, 츠루기 선배의 시선 앞에서 필사적으로 아무렇지 않은 척하고 있었다.)
코하루(보충수업부) : (애써 밝은 척) 그, 그럼 전 이만 가볼게요! 선배도 좋은 하루 보내세요! 정말 괜찮으니까 신경 쓰지 마세요! [emotion : koharu_embarrassed2.png]
narration : (코하루는 너덜너덜해진 책을 받아들고는 도망치듯 황급히 자리를 떠났다.)
deleteAll
waitSecond = 2
narration : (조금 떨어진 복도 구석에서, 코하루는 차마 눈 뜨고 보기 힘든 몰골의 책을 내려다보았다.) [bg : BG_ClassCorridor.jpg, music : morose_dreamer.mp3]
코하루(보충수업부) : (입술을 깨물며 울먹인다) ...흐윽. 어떻게 이럴 수가 있어. 겨우... 겨우 손에 넣은 초회 한정판이었는데... 이렇게 갈기갈기 찢어지다니... [emotion : koharu_crying.png]
narration : (코하루는 깊은 슬픔과 아쉬움에 잠겨, 찢어진 책 조각들을 소중하게 가방 깊숙이 넣었다. 정의실현부의 무서운 선배 앞에서는 차마 진심을 다 표현할 수 없었을 것이다.)
코하루(보충수업부) : (작은 목소리로 흐느끼며) ...어떻게든... 다시 붙여서... 하이라이트 장면만이라도... 흐어엉... [emotion : koharu_suspicious.png] // 이모션은 상황에 맞게 'crying' 이나 'disgusting' 등으로 변경 가능
deleteAll
waitSecond = 2
narration : (코하루의 슬픈 어깨를 보며, 오늘의 이 '야한 책' 대소동은 그렇게 비극적으로 마무리되는 듯했다.) [music : none]
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
