import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import EventPlayer from '@/components/event/EventPlayer';
import { consumePendingEvent } from '@/store/eventStore';

const PREVIEW = `selection : (1)"오늘은 무슨 일이야?" (2)"잠깐 쉬러 왔어." [speaker : 호시노(대책위원회), dialogue : 으헤~ 선생 왔구나. 아저씨는 이제 살았어., emotion : hoshino_feelGood.png, bg : BG_AbydosCouncilRoom.jpg, music : walkthrough.mp3]
호시노(대책위원회) : 으헤~ 선생 왔구나. 아저씨는 이제 살았어. [emotion : hoshino_feelGood.png]
호시노(대책위원회) : 그러니까, 오늘만큼은 느긋하게 쉬어 가자고. [emotion : hoshino_weakLaugh.png]
`;

export default function EventScreen() {
  const [script] = useState(() => consumePendingEvent() ?? PREVIEW);

  if (!script) return <Redirect href="/" />;

  return <EventPlayer script={script} />;
}
