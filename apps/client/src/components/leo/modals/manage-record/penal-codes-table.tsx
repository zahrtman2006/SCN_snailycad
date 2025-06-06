import { Table, useTableState } from "components/shared/Table";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { PenalCode } from "@snailycad/types";
import { TableItemForm } from "./table-item-form";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { createInitialRecordValues } from "./manage-record-modal";

interface Props {
  penalCodes: PenalCode[];
  isReadOnly?: boolean;
  isWithinCardOrModal?: boolean;
}

export function PenalCodesTable({ isReadOnly, penalCodes, isWithinCardOrModal = true }: Props) {
  const { values } = useFormikContext<ReturnType<typeof createInitialRecordValues>>();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const currency = common("currency");
  const { LEO_BAIL } = useFeatureEnabled();
  const tableState = useTableState();

  function sumOf(type: "fine" | "jailTime" | "bail"): number {
    let sum = 0;

    for (const violation of values.violations) {
      // skip deleted penal code
      if (!violation.value.id) continue;
      const counts = parseInt(String(violation.value.counts.value)) || 1;

      if (violation.value[type].value) {
        sum += parseInt(String(violation.value[type].value)) * counts;
      }
    }

    return sum;
  }

  function formatSum(sum: number) {
    return Intl.NumberFormat().format(sum);
  }

  if (penalCodes.length <= 0) {
    return <p className="mb-3">{t("noPenalCodesSelected")}</p>;
  }

  const totalFines = formatSum(sumOf("fine"));
  const totalJailTime = formatSum(sumOf("jailTime"));
  const totalBail = formatSum(sumOf("bail"));

  return (
    <div className="w-full my-3 overflow-x-auto">
      <Table
        features={{ isWithinCardOrModal }}
        tableState={tableState}
        data={penalCodes.map((penalCode) => ({
          id: penalCode.id,
          title: penalCode.title || t("deletedPenalCode"),
          data: <TableItemForm isReadOnly={isReadOnly} penalCode={penalCode} />,
        }))}
        columns={[
          { accessorKey: "title", header: t("penalCode") },
          { accessorKey: "data", header: "Data" },
        ]}
      />
      <p className="flex items-center justify-center w-full gap-2 p-2 px-3">
        <span className="mr-2 font-semibold uppercase select-none">
          {t("total").toUpperCase()}{" "}
        </span>

        <span className="ml-2">
          <span className="font-semibold select-none">{t("fines")}: </span> {currency}
          {totalFines || 0}
        </span>
        <span>{"/"}</span>
        <span className="ml-2">
          <span className="font-semibold select-none">{t("jailTime")}: </span>
          {totalJailTime || 0}
        </span>
        <span>{"/"}</span>
        {LEO_BAIL ? (
          <span className="ml-2">
            <span className="font-semibold select-none">{t("bail")}: </span> {currency}
            {totalBail || 0}
          </span>
        ) : null}
      </p>
    </div>
  );
}
