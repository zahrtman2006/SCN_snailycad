import { Loader, Button, TextField, SwitchField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { CREATE_COMPANY_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { useRouter } from "next/router";
import { toastMessage } from "lib/toastMessage";
import { WhitelistStatus } from "@snailycad/types";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import { GetBusinessesData, PostCreateBusinessData } from "@snailycad/types/api";
import { AddressPostalSelect } from "components/form/select/PostalSelect";

interface Props {
  onCreate?(employee: GetBusinessesData["ownedBusinesses"][number]): void;
}

export function CreateBusinessModal({ onCreate }: Props) {
  const modalState = useModal();
  const { state, execute } = useFetch();
  const router = useRouter();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const error = useTranslations("Errors");

  function handleClose() {
    modalState.closeModal(ModalIds.CreateBusiness);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostCreateBusinessData>({
      path: "/businesses/create",
      method: "POST",
      data: values,
    });

    if (json.id) {
      if (json.business.status === WhitelistStatus.PENDING) {
        toastMessage({ icon: "info", message: error("businessCreatedButPending") });
      } else {
        router.push(`/business/${json.id}/${json.employee?.id}`);
      }

      onCreate?.(json.employee);
      modalState.closeModal(ModalIds.CreateBusiness);
    }
  }

  const validate = handleValidate(CREATE_COMPANY_SCHEMA);
  const INITIAL_VALUES = {
    name: "",
    address: "",
    postal: "",
    ownerId: "",
    ownerName: "",
    whitelisted: false,
  };

  return (
    <Modal
      className="w-[700px]"
      title={t("createBusiness")}
      isOpen={modalState.isOpen(ModalIds.CreateBusiness)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <CitizenSuggestionsField
              autoFocus
              allowsCustomValue
              label={t("citizen")}
              fromAuthUserOnly
              labelFieldName="citizenName"
              valueFieldName="ownerId"
            />

            <TextField
              errorMessage={errors.name}
              label={t("name")}
              name="name"
              onChange={(value) => setFieldValue("name", value)}
              value={values.name}
            />

            <AddressPostalSelect />

            <SwitchField
              isSelected={values.whitelisted}
              onChange={(isSelected) => setFieldValue("whitelisted", isSelected)}
            >
              {t("whitelisted")}
            </SwitchField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("createBusiness")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
