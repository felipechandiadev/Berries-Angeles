export const ABILITY_VALUES = ['USERS_VIEW', 'USERS_CREATE', 'USERS_UPDATE', 'USERS_DELETE'] as const;

export type AbilityValue = typeof ABILITY_VALUES[number];

export type PermissionDefinition = {
  ability: AbilityValue;
  label: string;
  description: string;
};

const definitions: PermissionDefinition[] = [
  {
    ability: 'USERS_VIEW',
    label: 'Ver usuarios',
    description: 'Permite visualizar la lista y los detalles básicos de los usuarios.',
  },
  {
    ability: 'USERS_CREATE',
    label: 'Crear usuarios',
    description: 'Autoriza la creación de nuevas cuentas de usuario en el sistema.',
  },
  {
    ability: 'USERS_UPDATE',
    label: 'Editar usuarios',
    description: 'Habilita la modificación de información o roles de un usuario existente.',
  },
  {
    ability: 'USERS_DELETE',
    label: 'Eliminar usuarios',
    description: 'Permite desactivar o eliminar cuentas de usuario.',
  },
];

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = definitions;

export const validAbilities = new Set<AbilityValue>(definitions.map((definition) => definition.ability));

export function getPermissionDefinition(ability: AbilityValue): PermissionDefinition | undefined {
  return definitions.find((definition) => definition.ability === ability);
}
