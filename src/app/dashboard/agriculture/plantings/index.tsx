import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import IconPlus from "@/components/Icon/IconPlus";
import { useSafeT } from "@/hooks/useSafeT";
import { canCreateEntity } from "@/utils/permissions";
import { isLoggedIn } from "@/hooks/api/auth";
import FarmCategoryGuard from "@/components/auth/FarmCategoryGuard";
import { useCropTypes, useGrowFields, usePlantings } from "@/hooks/api/agriculture";

const STATUSES = ["PLANNED", "ACTIVE", "HARVESTED", "COMPLETE"];
const TREATMENT_TYPES = ["IRRIGATION", "FERTILIZER", "PESTICIDE", "HERBICIDE", "OTHER"];

export default function PlantingsPage() {
  const { t } = useSafeT();
  const role = isLoggedIn()?.role ?? "";
  const { items: cropTypes, fetchAll: fetchCrops } = useCropTypes();
  const { items: fields, fetchAll: fetchFields } = useGrowFields();
  const { items, loading, fetchAll, create, addTreatment, addHarvest } = usePlantings();
  const [open, setOpen] = useState(false);
  const [treatOpen, setTreatOpen] = useState<any>(null);
  const [harvestOpen, setHarvestOpen] = useState<any>(null);
  const [form, setForm] = useState({ cropTypeId: "", fieldId: "", plantedDate: "", expectedHarvestDate: "", status: "PLANNED", notes: "" });
  const [treatForm, setTreatForm] = useState({ type: "FERTILIZER", productName: "", quantity: "", unit: "kg", notes: "" });
  const [harvestForm, setHarvestForm] = useState({ quantity: "", unit: "kg", qualityGrade: "", notes: "" });

  useEffect(() => {
    fetchAll();
    fetchCrops();
    fetchFields();
  }, [fetchAll, fetchCrops, fetchFields]);

  const onSave = async () => {
    await create(form);
    setOpen(false);
  };

  return (
    <FarmCategoryGuard require="AGRICULTURE">
      <div className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold">{t("agriculture.plantingsTitle")}</h1>
            <p className="text-sm text-gray-500">{t("agriculture.plantingsSubtitle")}</p>
          </div>
          {canCreateEntity("plantings", role) && (
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <IconPlus className="w-4 h-4 ltr:mr-1 rtl:ml-1" /> {t("agriculture.addPlanting")}
            </button>
          )}
        </div>
        {loading ? <p>{t("common.loading")}</p> : (
          <div className="table-responsive">
            <table className="table-hover">
              <thead>
                <tr>
                  <th>{t("agriculture.cropName")}</th>
                  <th>{t("agriculture.fieldName")}</th>
                  <th>{t("agriculture.plantedDate")}</th>
                  <th>{t("agriculture.expectedHarvest")}</th>
                  <th>{t("agriculture.status")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.cropType?.name}</td>
                    <td>{row.field?.name}</td>
                    <td>{row.plantedDate ? new Date(row.plantedDate).toLocaleDateString() : "—"}</td>
                    <td>{row.expectedHarvestDate ? new Date(row.expectedHarvestDate).toLocaleDateString() : "—"}</td>
                    <td><span className="badge bg-primary">{row.status}</span></td>
                    <td className="flex flex-wrap gap-1">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => { setTreatOpen(row); setTreatForm({ type: "FERTILIZER", productName: "", quantity: "", unit: "kg", notes: "" }); }}>{t("agriculture.addTreatment")}</button>
                      <button type="button" className="btn btn-sm btn-outline-success" onClick={() => { setHarvestOpen(row); setHarvestForm({ quantity: "", unit: "kg", qualityGrade: "", notes: "" }); }}>{t("agriculture.recordHarvest")}</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} className="text-center text-gray-500 py-6">{t("agriculture.noPlantings")}</td></tr>}
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
              <Dialog.Title className="text-lg font-semibold">{t("agriculture.addPlanting")}</Dialog.Title>
              <select className="form-select" value={form.cropTypeId} onChange={(e) => setForm({ ...form, cropTypeId: e.target.value })}>
                <option value="">{t("agriculture.selectCrop")}</option>
                {cropTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="form-select" value={form.fieldId} onChange={(e) => setForm({ ...form, fieldId: e.target.value })}>
                <option value="">{t("agriculture.selectField")}</option>
                {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input type="date" className="form-input" value={form.plantedDate} onChange={(e) => setForm({ ...form, plantedDate: e.target.value })} />
              <input type="date" className="form-input" value={form.expectedHarvestDate} onChange={(e) => setForm({ ...form, expectedHarvestDate: e.target.value })} />
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={onSave}>{t("common.save")}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      <Transition show={!!treatOpen} as={Fragment}>
        <Dialog onClose={() => setTreatOpen(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="panel w-full max-w-md space-y-3">
              <Dialog.Title className="text-lg font-semibold">{t("agriculture.addTreatment")}</Dialog.Title>
              <select className="form-select" value={treatForm.type} onChange={(e) => setTreatForm({ ...treatForm, type: e.target.value })}>
                {TREATMENT_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <input className="form-input" placeholder={t("agriculture.productName")} value={treatForm.productName} onChange={(e) => setTreatForm({ ...treatForm, productName: e.target.value })} />
              <input className="form-input" type="number" placeholder={t("agriculture.quantity")} value={treatForm.quantity} onChange={(e) => setTreatForm({ ...treatForm, quantity: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => setTreatOpen(null)}>{t("common.cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={async () => { await addTreatment(treatOpen.id, treatForm); setTreatOpen(null); }}>{t("common.save")}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      <Transition show={!!harvestOpen} as={Fragment}>
        <Dialog onClose={() => setHarvestOpen(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="panel w-full max-w-md space-y-3">
              <Dialog.Title className="text-lg font-semibold">{t("agriculture.recordHarvest")}</Dialog.Title>
              <input className="form-input" type="number" placeholder={t("agriculture.quantity")} value={harvestForm.quantity} onChange={(e) => setHarvestForm({ ...harvestForm, quantity: e.target.value })} />
              <input className="form-input" placeholder={t("agriculture.unit")} value={harvestForm.unit} onChange={(e) => setHarvestForm({ ...harvestForm, unit: e.target.value })} />
              <input className="form-input" placeholder={t("agriculture.qualityGrade")} value={harvestForm.qualityGrade} onChange={(e) => setHarvestForm({ ...harvestForm, qualityGrade: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-outline-dark" onClick={() => setHarvestOpen(null)}>{t("common.cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={async () => { await addHarvest(harvestOpen.id, harvestForm); setHarvestOpen(null); }}>{t("common.save")}</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </FarmCategoryGuard>
  );
}
