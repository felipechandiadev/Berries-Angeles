'use client';
import { useState } from "react";
import { CollectionPageLayout } from "@felipechandiadev/ui";
import UserCard from "./userCard";
import CreateUserDialog from "./CreateUserDialog";
import IconButton from '@/app/baseComponents/IconButton/IconButton';

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export interface UserType {
  id: string;
  userName: string;
  mail: string;
  phone?: string;
  rol: string;
  person?: {
    name?: string;
    dni?: string;
  };
}

export interface UserListProps {
  users: UserType[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  return (
    <>
      <CollectionPageLayout
        title="Usuarios"
        showSearch
        searchParamName="search"
        searchLabel="Buscar"
        searchPlaceholder="Buscar usuario..."
        addAction={
          <IconButton
            icon="add"
            variant="outlined"
            aria-label="Agregar usuario"
            onClick={() => setOpenCreateDialog(true)}
            data-test-id="users-add-button"
          />
        }
        contentItems={users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            data-test-id={`user-card-${user.id}`}
          />
        ))}
        contentGridColumns={{ default: 1, sm: 2, lg: 3 }}
        contentGridGapClassName="gap-6"
        contentEmptyMessage="No hay usuarios para mostrar."
        data-test-id="users-list-container"
      />
      <CreateUserDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        data-test-id="users-create-dialog"
      />
    </>
  );
};

export default UserList;
