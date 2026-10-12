'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/data/db';
import { APP_CONFIG_SINGLETON_ID, AppConfig } from '@/data/entities/AppConfig';

export type AppConfigSettings = {
  requireBankAccountsInPayments: boolean;
};

export type AppConfigSettingsResult = {
  success: boolean;
  data?: AppConfigSettings;
  error?: string;
};

async function ensureAppConfigRow(): Promise<AppConfig> {
  const db = await getDb();
  const repo = db.getRepository(AppConfig);
  let row = await repo.findOne({ where: { id: APP_CONFIG_SINGLETON_ID } });

  if (!row) {
    row = repo.create({
      id: APP_CONFIG_SINGLETON_ID,
      requireBankAccountsInPayments: true,
    });
    row = await repo.save(row);
  }

  return row;
}

export async function getAppConfigSettings(): Promise<AppConfigSettingsResult> {
  try {
    const row = await ensureAppConfigRow();
    return {
      success: true,
      data: {
        requireBankAccountsInPayments: Boolean(row.requireBankAccountsInPayments),
      },
    };
  } catch (error: any) {
    console.error('[getAppConfigSettings] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al obtener la configuración',
      data: { requireBankAccountsInPayments: true },
    };
  }
}

export async function updateAppConfigSettings(
  input: Partial<AppConfigSettings>,
): Promise<AppConfigSettingsResult> {
  try {
    const db = await getDb();
    const repo = db.getRepository(AppConfig);
    const row = await ensureAppConfigRow();

    if (typeof input.requireBankAccountsInPayments === 'boolean') {
      row.requireBankAccountsInPayments = input.requireBankAccountsInPayments;
    }

    const saved = await repo.save(row);

    revalidatePath('/home/economicManagement/bankAccounts');
    revalidatePath('/home/economicManagement/advances');

    return {
      success: true,
      data: {
        requireBankAccountsInPayments: Boolean(saved.requireBankAccountsInPayments),
      },
    };
  } catch (error: any) {
    console.error('[updateAppConfigSettings] Error:', error);
    return {
      success: false,
      error: error?.message || 'Error al actualizar la configuración',
    };
  }
}
