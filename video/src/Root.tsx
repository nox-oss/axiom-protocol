import { Composition } from "remotion";
import { SolprismVideo } from "./SolprismVideo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="SolprismSubmission"
      component={SolprismVideo}
      durationInFrames={4500} // 2.5 min at 30fps
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
  );
};
