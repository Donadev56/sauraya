import React from "react";
import { IconCircleCheckFilled, IconRobot } from "@tabler/icons-react";
import style from "../../styles/modelSelector.module.scss";

type ModelSelectorProps = {
  currentModel: string;
  setCurrentModel: (model: string) => void;
  canModelSelectorDisplay?: boolean;
  setCanModelsDisplay: (display: boolean) => void;
};

export const ModelSelector = ({
  currentModel,
  setCanModelsDisplay,
  setCurrentModel,
}: ModelSelectorProps) => {
  const modelsList = [
    {
      name: "phi3:14b",
      desc: "A powerful for quick and efficient tasks.",
    },

    {
      name: "mistral",
      desc: "Funny Ai.",
    },
    {
      name: "llama3.2",
      desc: "A compact version for quick and efficient tasks.",
    },

    {
      name: "llava",
      desc: "Designed for understanding and describing images.",
    },
  ];

  const handleclick = (model: string) => {
    setCurrentModel(model);
    setCanModelsDisplay(false);
  };

  return (
    <section className={style.modelsContainer}>
      <div className={style.models}>
        <div className={style.modelsTitle}>
          Available Models <IconRobot color="white" />
        </div>

        <div className={style.modelsList}>
          {modelsList.map((model, index) => (
            <div
              key={index}
              className={style.model}
              onClick={() => handleclick(model.name)}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  justifyContent: "left",
                }}
                onClick={() => {
                  setCurrentModel(model.name);
                }}
                className={style.modelTitle}
              >
                {model.name}{" "}
                {currentModel === model.name && <IconCircleCheckFilled />}
              </div>
              <div className={style.modelDesc}>{model.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
