import * as React from "react";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { User } from "@snailycad/types";
import { ModalIds } from "types/modal-ids";
import { Modal } from "components/modal/Modal";
import { Loader } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { PostManageUsersGiveTempPasswordData } from "@snailycad/types/api";

interface Props {
  user: User;
}

export function GiveTempPasswordModal({ user }: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const t = useTranslations("Management");

  const [result, setResult] = React.useState<string | null>(null);

  async function fetchNewPassword() {
    const { json } = await execute<PostManageUsersGiveTempPasswordData>({
      path: `/admin/manage/users/temp-password/${user.id}`,
      method: "POST",
    });

    if (json) {
      setResult(json);
    }
  }

  React.useEffect(() => {
    if (!result && modalState.isOpen(ModalIds.GiveTempPassword)) {
      void fetchNewPassword();
    }

    if (result && !modalState.isOpen(ModalIds.GiveTempPassword)) {
      setTimeout(() => setResult(null), 90);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState, result]);

  return (
    <Modal
      className="w-[600px]"
      dialogClassName="z-[9999]"
      title={t("giveTempPassword")}
      onClose={() => modalState.closeModal(ModalIds.GiveTempPassword)}
      isOpen={modalState.isOpen(ModalIds.GiveTempPassword)}
    >
      {state === "loading" ? (
        <Loader />
      ) : result ? (
        <p className="mt-4">
          <span className="font-semibold">The following password</span>{" "}
          <span>&quot;{result}&quot;</span> will allow
          <span className="font-semibold"> {user.username}</span> to login.
        </p>
      ) : (
        <p>Could not fetch new password.</p>
      )}
    </Modal>
  );
}
