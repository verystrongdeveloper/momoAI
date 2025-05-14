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
타이틀 : 선도부의 비밀스러운 오후
narration : (게헨나 학원 선도부 사무실. 한가한 오후, 나는 문서 검토 부탁을 받고 들어섰다.) [bg : BG_GehennaStudentCouncil_Tent.jpg, music : unwelcome_school.mp3]
아코(선도부) : 선생님, 오셨군요. 기다리고 있었습니다. [emotion : ako_serious.png]
아코(선도부) : 오늘 검토해야 할 서류가 있어서 연락드렸습니다. 히나 부장님이 먼저 확인한 후 전달해 달라 하셨거든요. [emotion : ako_smile.png]
selection : (1)"히나는 어디 있어?" (2)"언제나처럼 바쁘네, 아코."
아코(선도부) : 히나 부장님은 잠시 자리를 비우셨습니다. 곧 돌아오실 겁니다. [emotion : ako_serious.png]
아코(선도부) : 아, 차 한 잔 내드릴게요. 오늘은 특별히 유자차를 준비했습니다. [emotion : ako_smile.png, sound : SE_Cup_02.mp3]
narration : (아코는 책상 위에 놓인 주전자에서 따뜻한 유자차를 따라 내밀었다.)
아코(선도부) : 요즘 건강관리 하고 계신가요? 감기 조심하셔야 합니다. [emotion : ako_curious.png]
selection : (1)"아코도 건강 챙기고 있어?" (2)"아코와 히나는 서로 잘 챙겨주나 보네."
아코(선도부) : 저야 뭐... 히나 부장님이 강제로라도 챙기게 하니까요. [emotion : ako_awkward.png]
아코(선도부) : 항상 "아코, 너 또 밤새웠지?" 하면서요... [emotion : ako_weaksmile.png]
narration : (아코의 얼굴이 살짝 붉어졌다.)
아코(선도부) : 그...그런데 부장님도 말이 좋아서 그렇지, 자신은 더 심하게 일하시면서... [emotion : ako_upset.png]
히나(선도부) : 내 얘기를 하고 있나 보네. [emotion : hina_expressionless.png]
narration : (갑작스러운 히나의 등장에 아코가 화들짝 놀랐다.) [animation : shakeX]
아코(선도부) : 히, 히나 부장님?! [emotion : ako_shout.png]
아코(선도부) : 언제 오셨어요? 문 여는 소리도 못 들었는데... [emotion : ako_sweating.png]
히나(선도부) : 방금. 선생도 왔네. [emotion : hina_expressionless.png]
히나(선도부) : 서류 검토하러 온 거지? [emotion : hina_serious.png]
selection : (1)"응, 아코가 연락해서 왔어." (2)"너희 둘 다 오늘따라 긴장된 분위기네."
히나(선도부) : 그래. 아코가 선생을 불러줬구나. [emotion : hina_weaksmile.png]
히나(선도부) : 방금 무슨 얘기했어? [emotion : hina_makebigeyes.png]
아코(선도부) : 아...아무것도 아니에요! 그냥 날씨 얘기를... [emotion : ako_shout_with_angry.png]
히나(선도부) : 그래? 날씨 얘기에 내 이름이 왜 나오지? [emotion : hina_makebigeyes.png]
아코(선도부) : 그건... 저... [emotion : ako_sweating.png]
narration : (아코가 당황한 기색이 역력하다. 히나는 의아한 표정으로 아코를 바라보았다.)
히나(선도부) : 하아... 중요한 건 아니니까 넘어갈게. [emotion : hina_closingeyes.png]
히나(선도부) : 아, 선생. 차 마셨어? 아코가 내려준 거? [emotion : hina_weaksmile.png]
selection : (1)"응, 유자차. 맛있더라." (2)"아코가 특별히 준비했다던데."
히나(선도부) : 그 차... [emotion : hina_embarrassed.png]
히나(선도부) : 사실 내가 좋아하는 건데. 아코가 그걸 어떻게 알았지? [emotion : hina_expressionless.png]
아코(선도부) : 그거야... 부장님이 언젠가 한 번 말씀하셨잖아요. [emotion : ako_awkward.png]
아코(선도부) : 유자차가 피로회복에 좋다고... 요즘 부장님이 많이 피곤해 보이셔서... [emotion : ako_weaksmile.png]
히나(선도부) : 그런 말을 했었나? [emotion : hina_sweating.png]
아코(선도부) : 네! 분명히 하셨어요! [emotion : ako_shout.png]
히나(선도부) : 그래? 기억이 안 나는데... [emotion : hina_expressionless.png]
narration : (뭔가 둘 사이에 미묘한 기류가 흐르는 것이 느껴졌다.)
히나(선도부) : 아무튼, 서류 확인하자. [emotion : hina_serious.png]
narration : (히나가 테이블 위에 서류 묶음을 올려놓았다.)
히나(선도부) : 이번 학기 선도부 활동 계획서야. 확인해 줘. [emotion : hina_expressionless.png]
selection : (1)"둘이 같이 검토하면 더 효율적일 것 같은데." (2)"난 잠시 자리를 비켜줄까?"
히나(선도부) : 둘이? 아코랑? [emotion : hina_makebigeyes.png]
아코(선도부) : 저...저도 같이요? [emotion : ako_sweating.png]
히나(선도부) : 나쁘지 않은 생각이네. [emotion : hina_weaksmile.png]
히나(선도부) : 아코, 넌 계획안 3페이지부터 검토해. 난 1페이지부터 볼게. [emotion : hina_serious.png]
아코(선도부) : 네, 알겠습니다! [emotion : ako_serious.png]
narration : (세 사람은 테이블에 둘러앉아 서류를 검토하기 시작했다. 잠시 침묵이 흐른다.)
아코(선도부) : 음... 이 부분은 좀 모호한 것 같은데요. [emotion : ako_serious.png]
아코(선도부) : "필요시 추가 인력 배치"라는 건 구체적으로 어떤 상황을 말하는 건가요? [emotion : ako_curious.png]
히나(선도부) : 그거? 축제 기간이랑 시험 기간에 순찰 인원 늘리는 거. [emotion : hina_expressionless.png]
아코(선도부) : 아, 그럼 이렇게 수정하는 게 좋겠네요. [emotion : ako_smile.png]
narration : (아코가 펜을 들어 메모를 하려다 실수로 히나의 손에 펜이 닿았다.) [sound : SE_Confirm_01.mp3]
아코(선도부) : 앗! 죄송합니다! [emotion : ako_awkward.png, animation : shakeY]
히나(선도부) : ... [emotion : hina_embarrassed.png]
히나(선도부) : 괜찮아. [emotion : hina_littlebitembarrassed.png]
narration : (순간 사무실 안이 어색한 침묵에 휩싸였다.)
selection : (1)"음, 차 좀 더 마실까?" (2)"두 사람, 요즘 괜찮아?"
히나(선도부) : 차... 그래, 차 좀 더 마시자. [emotion : hina_expressionless.png]
히나(선도부) : 아코, 차 좀 더 따라줄래? [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네! 당장 따라드릴게요. [emotion : ako_smile.png, sound : SE_Cup_02.mp3]
narration : (아코가 서둘러 차를 따르는 동안, 히나는 창문 밖을 바라보고 있다.)
아코(선도부) : 여기 있습니다. [emotion : ako_smile_with_closing_eyes.png]
히나(선도부) : 고마워. [emotion : hina_weaksmile.png]
아코(선도부) : 아, 저기... 부장님. [emotion : ako_serious.png]
히나(선도부) : 왜? [emotion : hina_expressionless.png]
아코(선도부) : 오늘 밤 순찰 일정 말인데요. 부장님이 많이 피곤해 보이셔서... 제가 대신 할까요? [emotion : ako_weaksmile.png]
히나(선도부) : ... [emotion : hina_closingeyes.png]
히나(선도부) : 괜찮아. 내가 할 수 있어. [emotion : hina_expressionless.png]
아코(선도부) : 하지만 부장님, 요즘 너무 무리하시는 것 같아요. [emotion : ako_serious.png]
selection : (1)"히나, 아코 말이 맞는 것 같아." (2)"서로 도와가며 일하는 게 좋을 것 같아."
히나(선도부) : ... [emotion : hina_closingeyes.png]
히나(선도부) : 선생까지 그런 말을 하네. [emotion : hina_weaksmile.png]
히나(선도부) : 그래, 알았어. 오늘은 아코랑 같이 순찰하자. [emotion : hina_expressionless.png]
아코(선도부) : 정말요?! [emotion : ako_bigsmile.png]
아코(선도부) : 아, 아니... 그러니까... 좋은 결정이십니다, 부장님. [emotion : ako_awkward.png]
히나(선도부) : 왜 그렇게 좋아하는 거야? 일인데. [emotion : hina_sweating.png]
아코(선도부) : 그건... 부장님이랑 함께 일하면 배울 게 많아서요. [emotion : ako_smile.png]
히나(선도부) : 그래? [emotion : hina_littlebitembarrassed.png]
narration : (히나가 작게 미소를 지었다. 평소와는 다른 표정이었다.)
selection : (1)"히나가 웃는 모습은 정말 보기 드물지." (2)"두 사람이 함께 있으면 분위기가 달라지네."
히나(선도부) : 뭐, 뭘 보고 있어? [emotion : hina_embarrassed.png]
아코(선도부) : 부장님, 얼굴이 빨개졌어요! [emotion : ako_bigsmile.png]
히나(선도부) : 안 그래. 그냥 더워서 그래. [emotion : hina_embarrassed3.png]
아코(선도부) : 하지만 여긴 에어컨이 잘 작동하고 있는데요? [emotion : ako_smile.png]
히나(선도부) : ... [emotion : hina_embarrassed2.png]
narration : (히나는 자리에서 벌떡 일어났다.)
히나(선도부) : 잠깐 바람 좀 쐬고 올게. [emotion : hina_embarrassed.png]
아코(선도부) : 부장님? 괜찮으세요? [emotion : ako_curious.png]
히나(선도부) : 괜찮아. 그냥... 잠시만. [emotion : hina_closingeyes.png, sound : SE_DoorClose_01.mp3]
narration : (히나가 급하게 사무실을 나갔다.)
selection : (1)"무슨 일이 있었던 거야?" (2)"아코, 히나한테 무슨 일이 생긴 거 아니야?"
아코(선도부) : 저도... 잘 모르겠어요. [emotion : ako_sweating.png]
아코(선도부) : 최근에 부장님이 조금... 이상하시긴 했어요. [emotion : ako_upset.png]
아코(선도부) : 제가 옆에 있으면 자꾸 당황하시고... [emotion : ako_weaksmile.png]
narration : (아코가 말끝을 흐렸다.)
아코(선도부) : 선생님... 비밀 하나 말해도 될까요? [emotion : ako_serious.png]
selection : (1)"물론이지. 무슨 일이야?" (2)"히나에 관한 일이야?"
아코(선도부) : 사실... 어제... [emotion : ako_awkward.png]
아코(선도부) : 제가 부장님께 편지를 드렸어요. [emotion : ako_upset.png]
아코(선도부) : 그... 감사하다는 내용이었는데... 조금 더 깊은 감정도 있었어요. [emotion : ako_sweating.png]
아코(선도부) : 아마도 그래서 부장님이 저를 보면 어색해하시는 것 같아요. [emotion : ako_upset.png]
selection : (1)"히나에게 고백한 거야?" (2)"아코, 너 히나를 좋아하는구나."
아코(선도부) : 고백이라기보다는... [emotion : ako_crying.png]
아코(선도부) : 네... 저는 부장님을 존경하는 것 이상으로... [emotion : ako_weaksmile.png]
아코(선도부) : 하지만 부장님의 반응을 보니... 아마 거절당한 것 같아요. [emotion : ako_upset.png]
narration : (아코의 표정이 어두워졌다.)
아코(선도부) : 이제 어쩌죠, 선생님? 부장님과 계속 일해야 하는데... [emotion : ako_crying.png]
selection : (1)"히나와 직접 대화해 보는 게 어때?" (2)"아직 히나가 분명하게 답한 건 아니잖아."
아코(선도부) : 대화요...? [emotion : ako_curious.png]
아코(선도부) : 하지만 부장님은 제 앞에서 도망가셨는걸요. [emotion : ako_upset.png]
narration : (갑자기 사무실 문이 열렸다.) 
히나(선도부) : 아코. [emotion : hina_serious.png]
아코(선도부) : 부, 부장님?! [emotion : ako_shout.png, animation : shakeX]
히나(선도부) : 할 얘기가 있어. [emotion : hina_expressionless.png]
히나(선도부) : 선생, 잠시 우리만 있게 해줄래? [emotion : hina_serious.png]
selection : (1)"그래, 이해해." (2)"응, 두 사람이서 잘 얘기해봐."
히나(선도부) : 고마워. [emotion : hina_weaksmile.png]
narration : (나는 조용히 자리에서 일어나 사무실 밖으로 나왔다.)
deleteAll
waitSecond = 2
narration : (복도에서 잠시 기다리는 동안, 선도부 사무실 안에서 무슨 일이 벌어지고 있을지 궁금했다.) [bg : BG_GehennaCorridor_Party.jpg]
narration : (약 10분 정도가 지나자 사무실 문이 열렸다.)
히나(선도부) : 선생, 들어와도 돼. [emotion : hina_expressionless.png]
selection : (1)"어떻게 됐어?" (2)"괜찮아 보이네."
히나(선도부) : ... [emotion : hina_littlebitembarrassed.png]
narration : (사무실로 들어서자 아코가 환하게 웃고 있었다.)
아코(선도부) : 선생님! [emotion : ako_bigsmile.png]
히나(선도부) : 일단 서류 검토부터 마무리하자. [emotion : hina_serious.png]
아코(선도부) : 네, 부장님! [emotion : ako_eyesmile.png]
narration : (두 사람 사이의 분위기가 확연히 달라져 있었다.)
selection : (1)"무슨 좋은 일이라도?" (2)"서류 검토 계속할까?"
히나(선도부) : 서류 검토 계속하자. [emotion : hina_embarrassed.png]
아코(선도부) : 네! 바로 시작하겠습니다! [emotion : ako_smile_with_closing_eyes.png]
narration : (히나와 아코는 서로 눈빛을 교환하며 미소를 지었다.)
히나(선도부) : 아코. [emotion : hina_weaksmile.png]
아코(선도부) : 네, 부장님? [emotion : ako_smile.png]
히나(선도부) : 차 좀 더 따라줄래? [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네! 당장이요! [emotion : ako_bigsmile.png, sound : SE_Cup_02.mp3]
narration : (아코가 차를 따르는 동안, 히나는 내게 작은 목소리로 말했다.)
히나(선도부) : 선생... 고마워. [emotion : hina_weaksmile2.png]
selection : (1)"무슨 일이 있었던 거야?" (2)"서로의 마음을 확인한 모양이네."
히나(선도부) : ... [emotion : hina_embarrassed.png]
히나(선도부) : 그냥... 서로 오해가 있었어. [emotion : hina_littlebitembarrassed.png]
히나(선도부) : 나도 아코에게 할 말이 있었거든. [emotion : hina_weaksmile.png]
narration : (히나의 표정에서 행복감이 묻어났다.)
아코(선도부) : 여기 차 있습니다! [emotion : ako_bigsmile.png]
히나(선도부) : 고마워, 아코. [emotion : hina_weaksmile.png]
아코(선도부) : 부장님... [emotion : ako_smile.png]
히나(선도부) : 응? [emotion : hina_weaksmile.png]
아코(선도부) : 아니에요. 그냥... 고맙습니다. [emotion : ako_smile_with_closing_eyes.png]
narration : (두 사람의 시선이 다시 한번 마주쳤다.)
selection : (1)"이제 서류 검토를 마무리할까?" (2)"나는 이만 가볼게."
히나(선도부) : 응, 서류 검토 마무리하자. [emotion : hina_serious.png]
히나(선도부) : 선생도 도와줘. [emotion : hina_expressionless.png]
아코(선도부) : 저도 열심히 하겠습니다! [emotion : ako_smile.png]
narration : (세 사람은 다시 서류 검토에 집중했다. 하지만 이제 사무실의 분위기는 완전히 달라져 있었다.)
narration : (시간이 흘러 검토가 끝나갈 무렵, 창밖으로는 저녁 노을이 지고 있었다.)
히나(선도부) : 다 끝났네. 고생했어. [emotion : hina_weaksmile.png]
아코(선도부) : 부장님도 수고하셨습니다. [emotion : ako_smile.png]
selection : (1)"두 사람도 이제 쉬는 게 좋겠어." (2)"저녁 식사는 어떻게 할 거야?"
히나(선도부) : 그러고 보니 저녁 시간이네. [emotion : hina_expressionless.png]
아코(선도부) : 맞아요. 벌써 이런 시간이... [emotion : ako_curious.png]
히나(선도부) : 아코. [emotion : hina_expressionless.png]
아코(선도부) : 네, 부장님? [emotion : ako_curious.png]
히나(선도부) : 저녁... 같이 먹을래? [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네?! [emotion : ako_shout.png]
아코(선도부) : 아, 네! 물론이죠! [emotion : ako_bigsmile.png]
히나(선도부) : 선생도 같이 갈래? [emotion : hina_weaksmile.png]
selection : (1)"아니, 나는 다른 약속이 있어." (2)"두 사람이서 가는 게 좋을 것 같아."
히나(선도부) : 그래? [emotion : hina_embarrassed.png]
히나(선도부) : 그럼... 아코, 우리 둘이서 가자. [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네, 부장님! [emotion : ako_bigsmile.png]
narration : (두 사람은 서류를 정리하고 함께 사무실을 나설 준비를 했다.)
히나(선도부) : 선생, 오늘 도와줘서 고마워. [emotion : hina_weaksmile.png]
아코(선도부) : 네, 정말 감사합니다, 선생님! [emotion : ako_smile_with_closing_eyes.png]
selection : (1)"별 거 아니야. 잘 다녀와." (2)"두 사람이 행복해 보여서 다행이야."
히나(선도부) : ... [emotion : hina_embarrassed.png]
아코(선도부) : 선생님... [emotion : ako_weaksmile.png]
히나(선도부) : 가자, 아코. [emotion : hina_littlebitembarrassed.png]
아코(선도부) : 네, 부장님! [emotion : ako_bigsmile.png, sound : SE_DoorClose_01.mp3]
narration : (두 사람은 함께 사무실을 나섰다. 창밖으로 보이는 저녁 노을이 두 사람의 모습을 붉게 물들였다.)
deleteAll
waitSecond = 2
narration : (나는 조용히 선도부 사무실을 나왔다. 복도 끝에서 히나와 아코가 나란히 걸어가는 모습이 보였다.) [bg : BG_GehennaStreet.jpg, music : future_bossa.mp3]
narration : (가끔은 엄격한 선도부장과 그의 충실한 행정관 사이에도 다른 감정이 피어날 수 있다는 것을 오늘 알게 된 것 같다.)
narration : (두 사람의 손이 우연히 스쳤고, 히나가 슬쩍 아코의 손을 잡는 모습을 보았다. 아코의 얼굴이 붉게 물들었다.)
narration : (게헨나 학원의 엄격한 규율 속에서도, 때로는 이런 따뜻한 순간이 있다는 것이 참 다행이라는 생각이 들었다.)
deleteAll
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
