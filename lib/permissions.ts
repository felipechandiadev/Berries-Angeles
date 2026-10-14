export const PERMISSION_CATEGORIES = [
  'users',
  'receptions',
  'dispatch',
  'trays',
  'productive',
  'economic',
  'varieties',
  'reports',
  'system',
] as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];

export const PERMISSION_CATEGORY_LABELS: Record<PermissionCategory, string> = {
  users: 'Usuarios',
  receptions: 'Recepciones',
  dispatch: 'Despacho',
  trays: 'Bandejas',
  productive: 'Gestión productiva',
  economic: 'Gestión económica',
  varieties: 'Variedades y calidades',
  reports: 'Reportes',
  system: 'Sistema',
};

export type PermissionDefinition = {
  ability: string;
  label: string;
  description: string;
  category: PermissionCategory;
};

const definitions: PermissionDefinition[] = [
  // Usuarios
  {
    ability: 'USERS_VIEW',
    label: 'Ver usuarios',
    description: 'Ver lista y detalle de usuarios.',
    category: 'users',
  },
  {
    ability: 'USERS_CREATE',
    label: 'Crear usuarios',
    description: 'Crear cuentas de usuario.',
    category: 'users',
  },
  {
    ability: 'USERS_UPDATE',
    label: 'Editar usuarios',
    description: 'Modificar datos de un usuario.',
    category: 'users',
  },
  {
    ability: 'USERS_DELETE',
    label: 'Eliminar usuarios',
    description: 'Desactivar o eliminar usuarios.',
    category: 'users',
  },
  {
    ability: 'USERS_MANAGE_PERMISSIONS',
    label: 'Administrar permisos',
    description: 'Asignar o quitar permisos a usuarios.',
    category: 'users',
  },

  // Recepciones
  {
    ability: 'RECEPTIONS_VIEW',
    label: 'Ver recepciones',
    description: 'Ver listado y detalle de recepciones.',
    category: 'receptions',
  },
  {
    ability: 'RECEPTIONS_CREATE',
    label: 'Crear recepciones',
    description: 'Registrar nuevas recepciones.',
    category: 'receptions',
  },
  {
    ability: 'RECEPTIONS_UPDATE',
    label: 'Editar recepciones',
    description: 'Modificar recepciones existentes.',
    category: 'receptions',
  },
  {
    ability: 'RECEPTIONS_DELETE',
    label: 'Eliminar recepciones',
    description: 'Eliminar o anular recepciones.',
    category: 'receptions',
  },
  {
    ability: 'RECEPTIONS_CHANGE_PRICES',
    label: 'Cambiar precios de recepción',
    description: 'Modificar precios/calidad al recibir o editar.',
    category: 'receptions',
  },
  {
    ability: 'RECEPTIONS_PAY_ON_RECEPTION',
    label: 'Pagar al recibir',
    description: 'Marcar recepción como pagada al momento.',
    category: 'receptions',
  },
  {
    ability: 'RECEPTIONS_EXPORT',
    label: 'Exportar recepciones',
    description: 'Exportar recepciones a Excel u otros formatos.',
    category: 'receptions',
  },
  {
    ability: 'RECEPTIONS_PRINT',
    label: 'Imprimir recepciones',
    description: 'Imprimir tickets o comprobantes de recepción.',
    category: 'receptions',
  },

  // Despacho
  {
    ability: 'DISPATCHES_VIEW',
    label: 'Ver despachos',
    description: 'Ver listado y detalle de despachos.',
    category: 'dispatch',
  },
  {
    ability: 'DISPATCHES_CREATE',
    label: 'Crear despachos',
    description: 'Crear nuevos despachos y sus pallets.',
    category: 'dispatch',
  },
  {
    ability: 'DISPATCHES_UPDATE',
    label: 'Editar despachos',
    description: 'Modificar o anular despachos existentes.',
    category: 'dispatch',
  },
  {
    ability: 'DISPATCHES_DELETE',
    label: 'Eliminar despachos',
    description: 'Eliminar despachos (con reversión asociada).',
    category: 'dispatch',
  },
  {
    ability: 'DISPATCHES_PRINT',
    label: 'Imprimir despachos',
    description: 'Imprimir tickets de despacho y pallets.',
    category: 'dispatch',
  },
  {
    ability: 'CUSTOMERS_VIEW',
    label: 'Ver clientes',
    description: 'Ver listado de clientes de despacho.',
    category: 'dispatch',
  },
  {
    ability: 'CUSTOMERS_CREATE',
    label: 'Crear clientes',
    description: 'Registrar nuevos clientes.',
    category: 'dispatch',
  },
  {
    ability: 'CUSTOMERS_UPDATE',
    label: 'Editar clientes',
    description: 'Modificar datos de clientes.',
    category: 'dispatch',
  },
  {
    ability: 'CUSTOMERS_DELETE',
    label: 'Eliminar clientes',
    description: 'Eliminar clientes.',
    category: 'dispatch',
  },
  {
    ability: 'PALLETS_VIEW',
    label: 'Ver pallets',
    description: 'Ver listado de pallets.',
    category: 'dispatch',
  },
  {
    ability: 'PALLETS_PRINT',
    label: 'Imprimir pallets',
    description: 'Imprimir tickets de pallet.',
    category: 'dispatch',
  },

  // Bandejas
  {
    ability: 'TRAYS_VIEW',
    label: 'Ver tipos de bandeja',
    description: 'Ver catálogo de bandejas y stock.',
    category: 'trays',
  },
  {
    ability: 'TRAYS_CREATE',
    label: 'Crear tipos de bandeja',
    description: 'Crear nuevos tipos de bandeja.',
    category: 'trays',
  },
  {
    ability: 'TRAYS_UPDATE',
    label: 'Editar tipos de bandeja',
    description: 'Modificar tipos de bandeja.',
    category: 'trays',
  },
  {
    ability: 'TRAYS_DELETE',
    label: 'Eliminar tipos de bandeja',
    description: 'Eliminar tipos de bandeja.',
    category: 'trays',
  },
  {
    ability: 'TRAYS_ADJUST_STOCK',
    label: 'Ajustar stock de bandejas',
    description: 'Realizar ajustes manuales de stock.',
    category: 'trays',
  },
  {
    ability: 'TRAYS_MOVEMENTS_VIEW',
    label: 'Ver movimientos de bandejas',
    description: 'Ver historial de movimientos.',
    category: 'trays',
  },
  {
    ability: 'TRAYS_MOVEMENTS_CREATE',
    label: 'Crear movimientos de bandejas',
    description: 'Registrar entregas/recepciones de bandejas.',
    category: 'trays',
  },

  // Productivo
  {
    ability: 'PRODUCERS_VIEW',
    label: 'Ver productores',
    description: 'Ver productores y su detalle.',
    category: 'productive',
  },
  {
    ability: 'PRODUCERS_CREATE',
    label: 'Crear productores',
    description: 'Registrar productores.',
    category: 'productive',
  },
  {
    ability: 'PRODUCERS_UPDATE',
    label: 'Editar productores',
    description: 'Modificar productores.',
    category: 'productive',
  },
  {
    ability: 'PRODUCERS_DELETE',
    label: 'Eliminar productores',
    description: 'Eliminar productores.',
    category: 'productive',
  },
  {
    ability: 'UNITS_VIEW',
    label: 'Ver unidades productivas',
    description: 'Ver unidades productivas.',
    category: 'productive',
  },
  {
    ability: 'UNITS_CREATE',
    label: 'Crear unidades productivas',
    description: 'Crear unidades productivas.',
    category: 'productive',
  },
  {
    ability: 'UNITS_UPDATE',
    label: 'Editar unidades productivas',
    description: 'Modificar unidades productivas.',
    category: 'productive',
  },
  {
    ability: 'UNITS_DELETE',
    label: 'Eliminar unidades productivas',
    description: 'Eliminar unidades productivas.',
    category: 'productive',
  },
  {
    ability: 'SEASONS_VIEW',
    label: 'Ver temporadas',
    description: 'Ver temporadas.',
    category: 'productive',
  },
  {
    ability: 'SEASONS_CREATE',
    label: 'Crear temporadas',
    description: 'Crear temporadas.',
    category: 'productive',
  },
  {
    ability: 'SEASONS_UPDATE',
    label: 'Editar temporadas',
    description: 'Modificar temporadas.',
    category: 'productive',
  },
  {
    ability: 'SEASONS_DELETE',
    label: 'Eliminar temporadas',
    description: 'Eliminar temporadas.',
    category: 'productive',
  },
  {
    ability: 'SEASONS_ACTIVATE',
    label: 'Activar temporada',
    description: 'Cambiar la temporada activa.',
    category: 'productive',
  },

  // Económico
  {
    ability: 'ADVANCES_VIEW',
    label: 'Ver anticipos',
    description: 'Ver anticipos a productores.',
    category: 'economic',
  },
  {
    ability: 'ADVANCES_CREATE',
    label: 'Crear anticipos',
    description: 'Registrar anticipos.',
    category: 'economic',
  },
  {
    ability: 'ADVANCES_UPDATE',
    label: 'Editar anticipos',
    description: 'Modificar anticipos.',
    category: 'economic',
  },
  {
    ability: 'ADVANCES_DELETE',
    label: 'Eliminar anticipos',
    description: 'Eliminar anticipos no aplicados.',
    category: 'economic',
  },
  {
    ability: 'ADVANCES_APPLY',
    label: 'Aplicar anticipos',
    description: 'Aplicar anticipos en liquidaciones.',
    category: 'economic',
  },
  {
    ability: 'SETTLEMENTS_VIEW',
    label: 'Ver liquidaciones',
    description: 'Ver liquidaciones.',
    category: 'economic',
  },
  {
    ability: 'SETTLEMENTS_CREATE',
    label: 'Crear liquidaciones',
    description: 'Crear liquidaciones a productores.',
    category: 'economic',
  },
  {
    ability: 'SETTLEMENTS_UPDATE',
    label: 'Editar liquidaciones',
    description: 'Modificar liquidaciones (borrador).',
    category: 'economic',
  },
  {
    ability: 'SETTLEMENTS_DELETE',
    label: 'Eliminar liquidaciones',
    description: 'Eliminar liquidaciones.',
    category: 'economic',
  },
  {
    ability: 'BANK_ACCOUNTS_VIEW',
    label: 'Ver cuentas bancarias',
    description: 'Ver cuentas bancarias de la empresa.',
    category: 'economic',
  },
  {
    ability: 'BANK_ACCOUNTS_CREATE',
    label: 'Crear cuentas bancarias',
    description: 'Registrar cuentas bancarias.',
    category: 'economic',
  },
  {
    ability: 'BANK_ACCOUNTS_UPDATE',
    label: 'Editar cuentas bancarias',
    description: 'Modificar cuentas bancarias.',
    category: 'economic',
  },
  {
    ability: 'BANK_ACCOUNTS_DELETE',
    label: 'Eliminar cuentas bancarias',
    description: 'Eliminar cuentas bancarias.',
    category: 'economic',
  },

  // Variedades / calidades
  {
    ability: 'VARIETIES_VIEW',
    label: 'Ver variedades',
    description: 'Ver variedades y calidades.',
    category: 'varieties',
  },
  {
    ability: 'VARIETIES_CREATE',
    label: 'Crear variedades',
    description: 'Crear variedades.',
    category: 'varieties',
  },
  {
    ability: 'VARIETIES_UPDATE',
    label: 'Editar variedades',
    description: 'Modificar variedades y calidades.',
    category: 'varieties',
  },
  {
    ability: 'VARIETIES_DELETE',
    label: 'Eliminar variedades',
    description: 'Eliminar variedades.',
    category: 'varieties',
  },
  {
    ability: 'VARIETIES_CHANGE_PRICES',
    label: 'Cambiar precios de variedad',
    description: 'Modificar precios por calidad.',
    category: 'varieties',
  },
  {
    ability: 'FORMATS_VIEW',
    label: 'Ver calidades',
    description: 'Ver tipos de calidad.',
    category: 'varieties',
  },
  {
    ability: 'FORMATS_CREATE',
    label: 'Crear calidades',
    description: 'Crear tipos de calidad.',
    category: 'varieties',
  },
  {
    ability: 'FORMATS_UPDATE',
    label: 'Editar calidades',
    description: 'Modificar tipos de calidad.',
    category: 'varieties',
  },
  {
    ability: 'FORMATS_DELETE',
    label: 'Eliminar calidades',
    description: 'Eliminar tipos de calidad.',
    category: 'varieties',
  },

  // Reportes
  {
    ability: 'REPORTS_RECEPTIONS',
    label: 'Reportes de recepciones',
    description: 'Ejecutar reportes del dominio recepciones.',
    category: 'reports',
  },
  {
    ability: 'REPORTS_ECONOMIC',
    label: 'Reportes económicos',
    description: 'Ejecutar reportes económicos.',
    category: 'reports',
  },
  {
    ability: 'REPORTS_OPERATIONAL',
    label: 'Reportes operativos',
    description: 'Ejecutar reportes operativos (merma, despacho, bandejas).',
    category: 'reports',
  },
  {
    ability: 'REPORTS_EXPORT',
    label: 'Exportar reportes',
    description: 'Exportar resultados de reportes.',
    category: 'reports',
  },

  // Sistema
  {
    ability: 'AUDIT_VIEW',
    label: 'Ver auditoría',
    description: 'Consultar el registro de auditoría.',
    category: 'system',
  },
  {
    ability: 'APP_CONFIG_UPDATE',
    label: 'Configurar aplicación',
    description: 'Modificar configuración general del sistema.',
    category: 'system',
  },
];

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] =
  Object.freeze(definitions);

export const ABILITY_VALUES = definitions.map((d) => d.ability) as readonly string[];

export type AbilityValue = (typeof ABILITY_VALUES)[number];

export const validAbilities = new Set<string>(ABILITY_VALUES);

export function getPermissionDefinition(
  ability: string,
): PermissionDefinition | undefined {
  return definitions.find((definition) => definition.ability === ability);
}

export type PermissionCategoryGroup = {
  category: PermissionCategory;
  categoryLabel: string;
  permissions: PermissionDefinition[];
};

/** Agrupa definiciones por categoría, en el orden canónico. */
export function groupPermissionsByCategory(
  items: readonly PermissionDefinition[],
): PermissionCategoryGroup[] {
  const map = new Map<PermissionCategory, PermissionDefinition[]>();
  for (const cat of PERMISSION_CATEGORIES) {
    map.set(cat, []);
  }
  for (const def of items) {
    const list = map.get(def.category);
    if (list) list.push(def);
    else map.set(def.category, [def]);
  }
  return PERMISSION_CATEGORIES.map((category) => ({
    category,
    categoryLabel: PERMISSION_CATEGORY_LABELS[category],
    permissions: map.get(category) ?? [],
  })).filter((g) => g.permissions.length > 0);
}
