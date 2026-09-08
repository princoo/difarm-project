import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import IconPlus from "@/components/Icon/IconPlus";
import { useSafeT } from "@/hooks/useSafeT";
import { canCreateEntity, canDeleteEntity, canUpdateEntity } from "@/utils/permissions";
import { isLoggedIn } from "@/hooks/api/auth";
import FarmCategoryGuard from "@/components/auth/FarmCategoryGuard";
import { useCropTypes } from "@/hooks/api/agriculture";

export default function CropTypesPage() {
  const { t } = useSafeT();
  const role = isLoggedIn()?.role ?? "";
  const { items, loading, fetchAll, create, update, remove } = useCropTypes();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", category: "", daysToMaturity: "", notes: "" });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", category: "", daysToMaturity: "", notes: "" });
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name ?? "",
      category: row.category ?? "",
      daysToMaturity: row.daysToMaturity != null ? String(row.daysToMaturity) : "",
      notes: row.notes ?? "",
    });
    setOpen(true);
  };

  const onSave = async () => {
    const payload = {
      name: form.name,
      category: form.category || undefined,
      daysToMaturity: form.daysToMaturity ? Number(form.daysToMaturity) : undefined,
      notes: form.notes || undefined,
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
            <h1 className="text-xl font-semibold">{t("agriculture.cropTypesTitle")}</h1>
            <p className="text-sm text-gray-500">{t("agriculture.cropTypesSubtitle")}</p>
          </div>
          {canCreateEntity("cropTypes", role) && (
            <button type="button" className="btn btn-primary" onClick={openNew}>
              <IconPlus className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> {t("agriculture.addCropType")}
            </button>
          )}
        </div>
        {loading ? (
          <p>{t("common.loading")}</p>
        ) : (
          <div className="table-responsive">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>{t("agriculture.cropName")}</th>
                  <th>{t("agriculture.category")}</th>
                  <th>{t("agriculture.daysToMaturity")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.category || "—"}</td>
                    <td>{row.daysToMaturity ?? "—"}</td>
                    <td className="flex gap-2">
                      {canUpdateEntity("cropTypes", role) && (
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEdit(row)}>{t("common.edit")}</button>
                      )}
                      {canDeleteEntity("cropTypes", role) && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(row.id)}>{t("common.delete")}</button>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-500 py-6">{t("agriculture.noCropTypes")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={() => setOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="panel w-full max-w-md">
              <Dialog.Title className="text-lg font-semibold mb-4">{editing ? t("agriculture.editCropType") : t("agriculture.addCropType")}</Dialog.Title>
              <div className="space-y-3">
                <input className="form-input" placeholder={t("agriculture.cropName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="form-input" placeholder={t("agriculture.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <input className="form-input" type="number" placeholder={t("agriculture.daysToMaturity")} value={form.daysToMaturity} onChange={(e) => setForm({ ...form, daysToMaturity: e.target.value })} />
                <textarea className="form-textarea" placeholder={t("common.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-5">
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
