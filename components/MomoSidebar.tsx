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
타이틀 : 감자 폭탄은 잠시 안녕
호시노(대책위원회) : 정말? 선생이 그렇게 말해주니 아저씨 기분 좋아졌어! [emotion : hoshino_bigLaugh.png, bg : BG_AbydosCouncilRoom.jpg, music : lovely_picnic.mp3]
호시노(대책위원회) : 으헤헤, 역시 선생은 착하다니까.
호시노(대책위원회) : 딴 애들이었으면 "아저씨, 또 시작이네" 하면서 츳코미 넣었을 텐데.
호시노(대책위원회) : 선생, 혹시 오늘 시간 있어? 아저씨랑 같이 땡땡이칠래? [emotion : hoshino_weakLaugh.png]
selection : (1)"좋아, 호시노. 가끔은 그런 시간도 필요하지." (2)"땡땡이라니, 또 무슨 재미있는 계획이라도 있는 거야?"
호시노(대책위원회) : 으헤헤, 역시 선생이야! 뭘 좀 안다니까~ [emotion : hoshino_bigLaugh.png]
호시노(대책위원회) : 아저씨는 말이지, 오늘 아주 중요한 임무를 계획했거든.
호시노(대책위원회) : 바로... 최고의 낮잠 스팟을 찾는 임무! [emotion : hoshino_feelGood.png]
호시노(대책위원회) : 대책위원회 위원장 대리 업무도 가끔은 피곤하다구, 으헤~
narration : (호시노는 여전히 졸린 눈이었지만, 그 안에는 장난기 가득한 활기가 넘실거렸다.) [bg : BG_AbydosCouncilRoom.jpg]
narration : (평소의 호시노다운 제안이었지만, 왠지 거절하기 어려운 매력이 있었다.)
호시노(대책위원회) : 자, 그럼 아저씨를 따라와, 선생. 비밀 작전 개시다! [emotion : hoshino_serious.png]
deleteAll
waitSecond = 1
narration : (호시노를 따라 나선 곳은 학생회실 한쪽 구석이었다.) [bg : BG_AbydosCouncilRoom.jpg, music : walkthrough.mp3]
호시노(대책위원회) : 으음... 여긴 햇볕이 너무 잘 들어서 탈락. [emotion : hoshino_suspicious.png]
호시노(대책위원회) : 낮잠은 역시 좀 어둑한 곳이 최고지. 안 그래, 선생?
narration : (창문으로 들어오는 햇살이 따스했지만, 호시노의 기준에는 맞지 않는 모양이었다.)
호시노(대책위원회) : 게다가 여긴 아야네 쨩한테 금방 들킬 것 같고. [emotion : hoshino_weakLaugh.png]
호시노(대책위원회) : 그 아이, 일 처리는 칼 같으니까 말이야. 아저씨의 땡땡이를 용납 못 할걸.
narration : (문밖에서 희미하게 서류를 넘기는 소리와 발소리가 들리는 듯했다.)
narration : (우리가 숨어있는 줄은 꿈에도 모르겠지.)
호시노(대책위원회) : 역시 여긴 아니야. 더 좋은 곳이 있을 거야. [emotion : hoshino_dontknowAnything.png]
호시노(대책위원회) : 아저씨의 감이 그렇게 말하고 있어! 다음 장소로 가자, 선생!
deleteAll
waitSecond = 1
narration : (다음으로 호시노가 나를 이끈 곳은 학교 뒤편, 거의 사용되지 않는 낡은 복도였다.) [bg : BG_AbandonedCorridor_Night.jpg, music : walkthrough.mp3]
호시노(대책위원회) : 으헤~ 여긴 좀 으스스한가? [emotion : hoshino_weakLaugh.png]
호시노(대책위원회) : 먼지가 좀 많긴 하지만... 아저씨는 이런 분위기, 싫지 않아.
narration : (발을 디딜 때마다 바닥의 먼지가 풀썩이는 소리가 났다. 확실히 인적이 드문 곳이었다.)
호시노(대책위원회) : 선생, 저기 봐봐. 저 문 너머에 뭔가 있을 것 같지 않아? [emotion : hoshino_makebigEye.png, expression : question_mark.png]
narration : (호시노가 낡은 문 하나를 가리켰다. 문에는 '자료보관실 3'이라고 희미하게 적혀 있었다.)
selection : (1)"한번 열어볼까?" (2)"안에 뭐가 있을지 모르는데, 괜찮을까?"
호시노(대책위원회) : 으헤헤, 선생도 궁금한가 보네? [emotion : hoshino_bigLaugh.png]
deleteEmotion
호시노(대책위원회) : 괜찮아, 괜찮아. 아저씨한테 맡겨두라구. [sound : SE_DoorSlowOpen_01.mp3]
narration : (호시노는 익숙하다는 듯 문고리를 잡아 돌렸다. 끼이익, 하는 소리와 함께 문이 천천히 열렸다.)
호시노(대책위원회) : 짜잔~ 어때, 선생? 아저씨의 예감이 맞았지? [emotion : hoshino_feelGood.png, bg : BG_AbandonedWarehouse.jpg]
narration : (문 안쪽은 생각보다 넓은 공간이었다. 창고로 쓰였던 건지 선반들이 있었지만, 대부분 비어있고 먼지만 자욱했다.)
narration : (하지만 방 한가운데, 놀랍게도 꽤나 멀쩡해 보이는 낡은 소파 하나가 놓여 있었다.)
호시노(대책위원회) : 으헤헤, 이거 완전 보물 발견 아니야? [emotion : hoshino_bigLaugh.png]
호시노(대책위원회) : 먼지는 좀 털어야겠지만, 이 정도면 특등석이지!
selection : (1)"정말 대단한 걸 찾아냈네, 호시노." (2)"먼지 알레르기는 없겠지, 아저씨?"
호시노(대책위원회) : 칭찬 고마워, 선생~ 아저씨의 눈썰미는 아직 죽지 않았다구. [emotion : hoshino_feelGood.png]
호시노(대책위원회) : 알레르기? 으헤~ 아저씨는 그런 거 없어. 잠만 잘 자면 뭐든 괜찮아.
narration : (호시노는 소파로 다가가 손으로 먼지를 툭툭 털어냈다. 생각보다 푹신해 보였다.)
호시노(대책위원회) : 자, 선생도 여기 앉아봐. 생각보다 괜찮다니까? [emotion : hoshino_weakLaugh.png]
narration : (나도 조심스럽게 소파 한쪽에 걸터앉았다. 오래된 가죽 냄새와 먼지 냄새가 섞여 났지만, 이상하게 아늑한 느낌이었다.)
호시노(대책위원회) : 으헤~ 역시... 아저씨의 선택은 틀리지 않았어. [emotion : hoshino_feelGood.png]
호시노(대책위원회) : 여긴 조용하고... 아무한테도 방해받지 않을 것 같아.
호시노(대책위원회) : 세리카의 감자 폭탄 소리도... 여기까지 들리진 않겠지? 으헤헤. [emotion : hoshino_bigLaugh.png]
narration : (창밖으로는 아비도스의 황량한 풍경이 보였지만, 이 작은 창고 안은 우리만의 아지트가 된 것 같았다.)
narration : (그때, 멀리서 희미하게 '쿵-' 하는 소리가 들려왔다.)
호시노(대책위원회) : ...어라? 선생, 방금 그 소리... 들었어? [emotion : hoshino_surprised.png, expression : question_mark.png]
selection : (1)"혹시... 감자 폭탄 2호라도 터진 걸까?" (2)"글쎄, 바람 소리 아닐까?"
호시노(대책위원회) : 으헤헤! 선생, 이제 아저씨 농담에 물들었구나! [emotion : hoshino_bigLaugh.png]
호시노(대책위원회) : 감자 폭탄 2호라니, 그거 마음에 드는데? 역시 선생은 센스가 있다니까.
deleteEmotion
호시노(대책위원회) : 뭐, 진짜 폭탄이든 아니든... 지금은 이 평화를 즐기자구. [emotion : hoshino_feelGood.png]
호시노(대책위원회) : 하아암~ 벌써부터 잠이 솔솔 오네... [emotion : hoshino_yawn.png]
narration : (호시노는 소파에 깊숙이 몸을 기댔다. 금방이라도 잠들 것처럼 눈이 스르륵 감겼다.)
호시노(대책위원회) : 선생... 옆에 있으니까... 따뜻하고... 안심돼... [emotion : hoshino_yawn2.png]
호시노(대책위원회) : 으헤헤... 좋은... 꿈을... 꿀 것 같아...
narration : (작은 목소리로 중얼거리던 호시노는 이내 고른 숨소리를 내며 잠이 들었다.) [music : morose_dreamer.mp3]
narration : (새근새근 잠든 얼굴은 평소의 장난기 대신 어린아이 같은 평온함만이 가득했다.)
narration : (이런 작은 휴식이 호시노에게 얼마나 소중한 시간일까. 잠깐이나마 모든 짐을 내려놓고 쉴 수 있도록.)
narration : (나는 소파 등받이에 기대, 잠든 호시노가 깨지 않도록 조용히 숨을 골랐다.)
narration : (창고 안에는 우리 둘의 숨소리와, 아주 가끔 들려오는 바람 소리만이 가득했다.)
deleteAll
waitSecond = 2
narration : (한참 동안 호시노가 곤히 자는 모습을 지켜보다, 다음 일정을 위해 조용히 자리에서 일어섰다.) [music : none]
narration : (부디, 좋은 꿈을 꾸기를. 감자 폭탄이 등장하지 않는, 평화로운 꿈을.)
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
