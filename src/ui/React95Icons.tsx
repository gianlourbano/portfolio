import {
    Shell321,
    FolderExe2,
    ReaderClosed,
    User,
    WindowsExplorer,
    FileText,
} from "@react95/icons";

const iconMap = {
    Terminal: Shell321,
    Projects: FolderExe2,
    Blog: ReaderClosed,
    About: User,
    Start: WindowsExplorer,
    Doc: FileText,
} as const;

type IconName = keyof typeof iconMap;

export function React95Icon({
    name,
    size = 24,
}: {
    name: IconName | string;
    size?: number;
}) {
    const Comp = (iconMap as any)[name];
    if (Comp) return <Comp variant="32x32_4" width={size} height={size} />;
    // fallback
    return (
        <span style={{ display: "inline-block", width: size, height: size }}>
            🪟
        </span>
    );
}
