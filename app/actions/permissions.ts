'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getDb } from '../../data/db';
import { Permission, Ability } from '../../data/entities/Permission';
import { validAbilities, AbilityValue } from '../../lib/permissions';

export type UpdateUserPermissionsInput = {
  userId: string;
  abilities: AbilityValue[];
};

export async function getUserPermissions(userId: string): Promise<AbilityValue[]> {
  if (!userId || typeof userId !== 'string') {
    return [];
  }

  try {
    const db = await getDb();
    const repo = db.getRepository(Permission);
    const permissions = await repo.find({
      select: ['ability'],
      where: { userId },
    });

    return permissions
      .map((permission) => permission.ability as AbilityValue)
      .filter((ability): ability is AbilityValue => validAbilities.has(ability));
  } catch (error) {
    console.error('[getUserPermissions] Error loading permissions:', error);
    return [];
  }
}

export async function updateUserPermissions({ userId, abilities }: UpdateUserPermissionsInput) {
  if (!userId || typeof userId !== 'string') {
    return { success: false, message: 'ID de usuario inválido' };
  }

  const filteredAbilities = (abilities || []).filter((ability): ability is AbilityValue => validAbilities.has(ability));

  try {
    const db = await getDb();
    const queryRunner = db.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Permission, { userId });

      if (filteredAbilities.length > 0) {
        const permissionEntities = filteredAbilities.map((ability) => {
          const permission = new Permission();
          permission.id = randomUUID();
          permission.userId = userId;
          permission.ability = ability as Ability;
          permission.description = undefined;
          return permission;
        });

        await queryRunner.manager.save(Permission, permissionEntities);
      }

      await queryRunner.commitTransaction();
      revalidatePath('/home/users');

      return { success: true };
    } catch (transactionError) {
      await queryRunner.rollbackTransaction();
      console.error('[updateUserPermissions] Transaction error:', transactionError);
      return { success: false, message: 'Error al actualizar los permisos del usuario' };
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('[updateUserPermissions] Error:', error);
    return { success: false, message: 'Error al actualizar los permisos del usuario' };
  }
}
