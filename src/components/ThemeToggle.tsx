import React from "react";
import { Button, ToolbarItem, Tooltip } from "@patternfly/react-core";
import { MoonIcon, SunIcon, LaptopIcon } from "@patternfly/react-icons";
import { useTheme } from "src/ThemeContext";

const LABELS = {
  light: "Light mode (click for dark)",
  dark: "Dark mode (click for auto)",
  auto: "Auto / system theme (click for light)",
} as const;

const ICONS = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  auto: <LaptopIcon />,
} as const;

const ThemeToggle: React.FC = () => {
  const { mode, cycleTheme } = useTheme();

  return (
    <ToolbarItem>
      <Tooltip content={LABELS[mode]}>
        <Button
          variant="plain"
          aria-label={LABELS[mode]}
          data-cy="theme-toggle"
          onClick={cycleTheme}
          icon={ICONS[mode]}
        />
      </Tooltip>
    </ToolbarItem>
  );
};

export default ThemeToggle;
