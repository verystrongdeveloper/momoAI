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
타이틀 : 정의와 압수품 사이
narration : (트리니티 학원 복도. 점심시간이 끝난 후인지 학생들이 삼삼오오 교실로 향하고 있다. 저 멀리서 코하루가 보충수업부 친구들과 무언가에 대해 열띠게 토론하며 걸어오고 있다.) [bg : BG_Campus.jpg, music : lovely_picnic.mp3]
코하루(보충수업부) : 그러니까! 그런 건 풍기문란이라니까! 정말이지, 요즘 애들은…! [emotion : koharu_shout.png]
narration : (코하루가 열변을 토하며 손을 휘젓다, 들고 있던 분홍색 표지의 책 한 권을 놓치고 만다. 하지만 이야기에 심취한 코하루는 전혀 눈치채지 못한 채 친구들과 함께 사라진다.) [sound : SE_Book_02.mp3]
waitSecond = 2
narration : (그때, 복도를 순찰 중이던 츠루기가 바닥에 떨어진 책을 발견한다.) [bg : BG_Campus.jpg, music : morose_dreamer.mp3]
츠루기(정의실현부) : …응? 이건. [emotion : tsurugi_curious.png]
narration : (책을 집어 든 츠루기는 표지를 보고 코하루의 것임을 직감한다. 마침 멀지 않은 곳에 코하루의 뒷모습이 보인다.)
츠루기(정의실현부) : 코하루…! 네놈, 물건을 떨어뜨렸… [emotion : tsurugi_default.png]
narration : (츠루기가 코하루를 부르려던 순간, 즐겁게 웃으며 친구들과 이야기하는 코하루의 모습이 눈에 들어온다. 츠루기는 잠시 멈칫한다.)
츠루기(정의실현부) : (…지금은… 방해하지 않는 편이 좋겠군. 나중에 전해주자.) [emotion : tsurugi_serious.png]
narration : (츠루기는 책을 자신의 옆구리에 끼고 순찰을 계속한다.)
deleteAll
waitSecond = 2
narration : (몇 시간 후, 정의실현부 부실. 츠루기는 산더미 같은 서류 옆에 코하루의 책을 잠시 내려놓았다.) [bg : BG_CommitteeRoom.jpg, music : morose_dreamer.mp3]
츠루기(정의실현부) : 하아… 이놈의 서류는 끝이 없군. [emotion : tsurugi_serious.png]
narration : (그때, 열린 창문으로 바람이 휙 불어와 책상 위의 서류 몇 장과 함께 코하루의 책 페이지를 빠르게 넘겼다.) [sound : SE_BushRusting_02b.mp3]
츠루기(정의실현부) : 응? [emotion : tsurugi_curious.png]
narration : (츠루기의 시선이 우연히 펼쳐진 책의 한 페이지에 머문다. 그곳에는 상당히… 자극적인 삽화와 문구들이 가득했다.)
츠루기(정의실현부) : 이, 이, 이건… 뭐냐… 이… 파렴치한 것은…!! [emotion : tsurugi_shock.png, expression : question_mark.png, animation : shakeX]
narration : (츠루기의 눈이 점점 커지고, 얼굴이 터질 듯이 새빨개지기 시작한다. 손에 든 책이 부들부들 떨린다.)
츠루기(정의실현부) : 키에에에에에에에에에에에에에에에에에에에에에엑!! [emotion : tsurugi_embarrassed2.png, sound : SE_Cartoon_02.mp3, animation : shakeY]
narration : (츠루기는 극도의 부끄러움과 당황함에 어쩔 줄 몰라하며 부실 안을 허둥지둥 뛰어다녔다. 그 과정에서 손에 쥐고 있던 코하루의 책은 츠루기의 격렬한 몸짓에 이리저리 구겨지고, 바닥에 떨어져 몇 번이나 밟히면서 속절없이 찢어지고 말았다.) [sound : SE_BoomEffect_02.mp3]
waitSecond = 3
deleteAll
narration : (다음 날 아침, 츠루기는 밤새 테이프로 간신히 형태만 복구한 너덜너덜한 책을 들고 코하루를 찾아 나섰다. 그녀의 얼굴에는 수심이 가득했다.) [bg : BG_Campus.jpg, music : morose_dreamer.mp3]
츠루기(정의실현부) : (…이걸 어쩐다… 코하루, 엄청나게 화내겠지…?) [emotion : tsurugi_awkward.png, expression : sweat.png]
narration : (복도 저편에서 코하루가 걸어오는 것이 보인다.)
코하루(보충수업부) : 어라? 츠루기 선배? 웬일이세요, 아침부터. [emotion : koharu_default.png]
츠루기(정의실현부) : 코, 코하루…! 저, 저기… 그게…! [emotion : tsurugi_embarrassed.png]
narration : (츠루기는 덜덜 떨리는 손으로 너덜너덜해진 책을 내밀었다.)
츠루기(정의실현부) : 이, 이거… 네놈 것이지 않나…? 그게… 어제, 내가… 그… 실수로…! 일부러 그런 게 절대 아니다! 정말이다! 미, 미안하다아아! [emotion : tsurugi_embarrassed2.png, sound : SE_Denied_01.mp3]
코하루(보충수업부) : 에엣?! 이, 이건 제… 아니, 제가 압수한 책인데요?! 어쩌다가 이렇게 너덜너덜…?! [emotion : koharu_embarrassed.png, expression : sweat.png]
narration : (코하루는 경악했지만, 정의실현부 부장인 츠루기 앞에서 차마 화를 낼 수는 없었다. 게다가 츠루기의 평소 모습을 알기에 고의가 아니라는 것도 짐작할 수 있었다.)
코하루(보충수업부) : 아, 아뇨! 괜찮아요! 어차피 풍기문란한 압수품이었으니까요! 이렇게 된 것도 뭐… 어쩔 수 없죠! 헤헤. [emotion : koharu_embarrassed2.png]
narration : (코하루는 애써 웃어 보였지만, 너덜너덜해진 책을 받아든 그녀의 눈가에는 미세한 경련과 함께 깊은 아쉬움이 서려 있었다.)
츠루기(정의실현부) : …저, 정말 괜찮나? [emotion : tsurugi_awkward.png]
코하루(보충수업부) : 네, 네에! 그럼요! 전 이제 수업 가봐야 해서…! 나중에 봬요, 선배! [emotion : koharu_closingeyes.png]
narration : (코하루는 황급히 자리를 떴다. 츠루기는 그 뒷모습을 착잡한 심정으로 바라보았다.)
츠루기(정의실현부) : (…역시, 엄청나게 실망한 것 같군…) [emotion : tsurugi_awkward.png]
narration : (한편, 코하루는 복도 모퉁이를 돌자마자 책을 부여잡고 작게 절규했다.)
코하루(보충수업부) : (내 소중한 연구자료가아…! 사형이야, 사형! …아니, 츠루기 선배가 일부러 그런 건 아니지만… 그래도… 으아앙! 다시 구해야 하잖아!) [emotion : koharu_crying.png, bg : BG_ClassCorridor.jpg]
deleteAll
waitSecond = 2
narration : (정의와 압수품 사이에서, 오늘도 트리니티의 하루는 소란스럽게 흘러간다.) [music : none]
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
