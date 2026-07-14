import type { ReactNode } from 'react';
import { capitalize } from 'lodash';
import { useNavigate } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { canUpdateEntity } from '@/utils/permissions';
import formatDateToLongForm from '@/utils/DateFormattter';

export type FarmProfileData = {
  id?: string;
  name?: string;
  registrationNo?: string | null;
  type?: string | null;
  yearEstablished?: number | null;
  description?: string | null;
  location?: string | null;
  landmarks?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  size?: number | string | null;
  grazingArea?: number | string | null;
  housingCapacity?: number | null;
  waterSource?: string | null;
  hasElectricity?: boolean | null;
  veterinaryAccess?: string | null;
  primaryLivestock?: string | null;
  breeds?: string | null;
  herdSizeEstimate?: number | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  emergencyContact?: string | null;
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
  owner?: { fullname?: string | null } | null;
  managerId?: string | null;
  managerLinks?: { userId: string; user?: { id?: string; fullname?: string } }[];
};

function display(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  return String(value);
}

function Field({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white break-words">
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</dl>
    </section>
  );
}

type Props = {
  farm: FarmProfileData;
  /** When true, show edit (admins) and status chrome. */
  showActions?: boolean;
  className?: string;
};

export default function FarmProfileSection({
  farm,
  showActions = true,
  className = '',
}: Props) {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const canEdit = canUpdateEntity('farms', user?.role ?? '');

  const livestock = String(farm.primaryLivestock ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const managerName =
    farm.managerLinks?.find((l) => l.userId === farm.managerId)?.user
      ?.fullname ||
    farm.managerLinks?.[0]?.user?.fullname;

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="rounded-xl border border-teal-200/80 dark:border-teal-800 bg-gradient-to-br from-[#f0faf9] via-white to-white dark:from-teal-950/40 dark:via-gray-800 dark:to-gray-800 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Farm profile
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {display(farm.name, 'Unnamed farm')}
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {display(farm.location)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  farm.status
                    ? 'bg-success-light text-success'
                    : 'bg-warning-light text-warning'
                }`}
              >
                {farm.status ? 'Activated' : 'Pending activation'}
              </span>
              {farm.type && (
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs">
                  {capitalize(String(farm.type))}
                </span>
              )}
              {farm.registrationNo && (
                <span className="text-xs">Reg. {farm.registrationNo}</span>
              )}
            </div>
          </div>
          {showActions && canEdit && farm.id && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate(`/account/farms/${farm.id}/edit`)}
            >
              Edit profile
            </button>
          )}
        </div>
        {farm.description && (
          <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
            {farm.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Farm identity" subtitle="Name, type & overview">
          <Field label="Farm name" value={display(farm.name)} />
          <Field label="Registration no." value={display(farm.registrationNo)} />
          <Field
            label="Farm type"
            value={farm.type ? capitalize(String(farm.type)) : '—'}
          />
          <Field label="Year established" value={display(farm.yearEstablished)} />
          <Field
            label="Description"
            value={display(farm.description)}
            fullWidth
          />
        </Section>

        <Section title="Location" subtitle="Address & geography">
          <Field label="Location" value={display(farm.location)} fullWidth />
          <Field label="Landmarks" value={display(farm.landmarks)} fullWidth />
          <Field label="Latitude" value={display(farm.latitude)} />
          <Field label="Longitude" value={display(farm.longitude)} />
        </Section>

        <Section title="Land & facilities" subtitle="Size, water & infrastructure">
          <Field
            label="Total land size"
            value={
              farm.size != null && farm.size !== ''
                ? `${farm.size} ha`
                : '—'
            }
          />
          <Field
            label="Grazing area"
            value={
              farm.grazingArea != null && farm.grazingArea !== ''
                ? `${farm.grazingArea} ha`
                : '—'
            }
          />
          <Field
            label="Housing capacity"
            value={
              farm.housingCapacity != null
                ? `${farm.housingCapacity} animals`
                : '—'
            }
          />
          <Field label="Water source" value={display(farm.waterSource)} />
          <Field
            label="Electricity"
            value={farm.hasElectricity ? 'Yes' : 'No'}
          />
          <Field
            label="Veterinary access"
            value={display(farm.veterinaryAccess)}
          />
        </Section>

        <Section title="Livestock profile" subtitle="Animals & herd size">
          <Field
            label="Primary livestock"
            value={
              livestock.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {livestock.map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                '—'
              )
            }
            fullWidth
          />
          <Field label="Breeds" value={display(farm.breeds)} fullWidth />
          <Field
            label="Herd size estimate"
            value={display(farm.herdSizeEstimate)}
          />
        </Section>

        <Section title="Contact" subtitle="How to reach the farm">
          <Field label="Phone" value={display(farm.contactPhone)} />
          <Field label="Email" value={display(farm.contactEmail)} />
          <Field
            label="Emergency contact"
            value={display(farm.emergencyContact)}
            fullWidth
          />
        </Section>

        <Section title="Management" subtitle="Ownership & access">
          <Field
            label="Owner"
            value={
              farm.owner?.fullname
                ? capitalize(String(farm.owner.fullname))
                : '—'
            }
          />
          <Field label="Manager" value={display(managerName)} />
          <Field
            label="Registered"
            value={
              farm.createdAt ? formatDateToLongForm(farm.createdAt) : '—'
            }
          />
          <Field
            label="Last updated"
            value={
              farm.updatedAt ? formatDateToLongForm(farm.updatedAt) : '—'
            }
          />
        </Section>
      </div>
    </div>
  );
}

/** Unwrap GET /farms/farm/:id response shapes. */
export function unwrapFarmProfile(payload: unknown): FarmProfileData | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as { data?: unknown };
  let data = body.data ?? payload;
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    const nested = (data as { data?: unknown }).data;
    if (nested && typeof nested === 'object') data = nested;
  }
  if (!data || typeof data !== 'object') return null;
  const farm = data as FarmProfileData;
  return farm.id ? farm : null;
}
