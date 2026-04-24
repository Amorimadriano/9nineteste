import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { TutorialVideo } from "./TutorialVideo";
import { ConciliacaoTutorialVideo } from "./ConciliacaoTutorialVideo";
import { TutorialCompletoVideo } from "./TutorialCompletoVideo";
import { InstagramReels } from "./instagram/InstagramReels";
import { InstagramShowcase } from "./instagram/InstagramShowcase";

// 18 scenes, 17 transitions of 15 frames
// 160+170+180+190+180+170+180+170+190+160+180+180+180+190+170+170+170+180 = 3160
// 17 scenes, 16 transitions of 15 frames
// 2990 - (16*15) = 2990 - 240 = 2750

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={840}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="tutorial"
      component={TutorialVideo}
      durationInFrames={1556}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="conciliacao"
      component={ConciliacaoTutorialVideo}
      durationInFrames={1352}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="tutorial-completo"
      component={TutorialCompletoVideo}
      durationInFrames={2750}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="instagram-reels"
      component={InstagramReels}
      durationInFrames={840}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="instagram-showcase"
      component={InstagramShowcase}
      durationInFrames={1120}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
