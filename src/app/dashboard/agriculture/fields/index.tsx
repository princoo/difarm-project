import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import IconPlus from "@/components/Icon/IconPlus";
import { useSafeT } from "@/hooks/useSafeT";
import { canCreateEntity, canDeleteEntity, canUpdateEntity } from "@/utils/permissions";
import { isLoggedIn } from "@/hooks/api/auth";
import FarmCategoryGuard from "@/components/auth/FarmCategoryGuard";
import { useGrowFields } from "@/hooks/api/agriculture";

const FIELD_TYPES = ["FIELD", "BED", "GREENHOUSE", "ORCHARD", "OTHER"];

export default function FieldsPage() {
  const { t } = useSafeT();
  const role = isLoggedIn()?.role ?? "";
  const { items, loading, fetchAll, create, update, remove } = useGrowFields();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", size: "", unit: "hectares", fieldType: "FIELD", locationNotes: "" });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onSave = async () => {
    const payload = {
      name: form.name,
      size: form.size ? Number(form.size) : undefined,
      unit: form.unit,
      fieldType: form.fieldType,
      locationNotes: form.locationNotes || undefined,
    };
    if (editing) await update(editing.id, payload);
    else await create(payload);
    setOpen(false);
  };

  return (
    <FarmCategoryGuard require="AGRICULTURE">
      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold">{t("agriculture.fieldsTitle")}</h1>
            <p className="text-sm text-gray-500">{t("agriculture.fieldsSubtitle")}</p>
          </div>
          {canCreateEntity("fields", role) && (
            <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: "", size: "", unit: "hectares", fieldType: "FIELD", locationNotes: "" }); setOpen(true); }}>
              <IconPlus className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> {t("agriculture.addField")}
            </button>
          )}
        </div>
        {loading ? <p>{t("common.loading")}</p> : (
          <div className="table-responsive">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>{t("agriculture.fieldName")}</th>
                  <th>{t("agriculture.fieldType")}</th>
                  <th>{t("agriculture.size")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.fieldType}</td>
                    <td>{row.size != null ? `${row.size} ${row.unit}` : "—"}</td>
                    <td className="flex gap-2">
                      {canUpdateEntity("fields", role) && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => { setEditing(row); setForm({ name: row.name, size: row.size != null ? String(row.size) : "", unit: row.unit ?? "hectares", fieldType: row.fieldType ?? "FIELD", locationNotes: row.locationNotes ?? "" }); setOpen(true); }}>{t("common.edit")}</button>}
                      {canDeleteEntity("fields", role) && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(row.id)}>{t("common.delete")}</button>}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-6">{t("agriculture.noFields")}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Transition show={open} as={Fragment}>
        <Dialog onClose={() => setOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="panel w-full max-w-md space-y-3">
              <Dialog.Title className="text-lg font-semibold">{editing ? t("agriculture.editField") : t("agriculture.addField")}</Dialog.Title>
              <input className="form-input" placeholder={t("agriculture.fieldName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="form-select" value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value })}>
                {FIELD_TYPES.map((ft) => <option key={ft} value={ft}>{ft}</option>)}
              </select>
              <input className="form-input" type="number" step="0.01" placeholder={t("agriculture.size")} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
              <input className="form-input" placeholder={t("agriculture.unit")} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              <textarea className="form-textarea" placeholder={t("agriculture.locationNotes")} value={form.locationNotes} onChange={(e) => setForm({ ...form, locationNotes: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={onSave}>{t("common.save")}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </FarmCategoryGuard>
  );
}
