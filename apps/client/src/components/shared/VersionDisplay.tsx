import { useMounted } from "@casperiv/useful";
import { cad } from "@snailycad/types";

interface Props {
  cad: Pick<cad, "version"> | null;
}

export function VersionDisplay({ cad }: Props) {
  const isMounted = useMounted();
  if (!cad?.version || !isMounted) {
    return null;
  }

  const releaseURL = `https://github.com/zahrtman2006/SCN_snailycad/releases/tag/${cad.version.currentVersion}`;
  const commitURL = `https://github.com/zahrtman2006/SCN_snailycad/commit/${cad.version.currentCommitHash}`;
  return (
    <div className="text-gray-900 dark:text-gray-200 block mt-3 text-base z-50">
      <Link href={releaseURL}>v{cad.version.currentVersion}</Link> {"—"}{" "}
      <Link href={commitURL}>{cad.version.currentCommitHash}</Link>
    </div>
  );
}

function Link(props: React.JSX.IntrinsicElements["a"]) {
  return (
    <a
      {...props}
      className="underline text-neutral-700 dark:text-gray-400 mx-2"
      target="_blank"
      rel="noopener noreferrer"
    />
  );
}
