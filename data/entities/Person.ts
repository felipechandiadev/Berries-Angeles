import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum AccountTypeName {
    CUENTA_CORRIENTE = "Cuenta Corriente",
    CUENTA_AHORRO = "Cuenta de Ahorro",
    CUENTA_VISTA = "Cuenta Vista",
    CUENTA_RUT = "Cuenta RUT",
    CUENTA_CHEQUERA = "Cuenta Chequera Electrónica",
    OTRO_TIPO = "Otro",
}

export enum BankName {
    BANCO_CHILE = "Banco de Chile",
    BANCO_ESTADO = "Banco del Estado de Chile",
    BANCO_SANTANDER = "Banco Santander Chile",
    BANCO_BCI = "Banco de Crédito e Inversiones",
    BANCO_FALABELLA = "Banco Falabella",
    BANCO_SECURITY = "Banco Security",
    BANCO_CREDICHILE = "Banco CrediChile",
    BANCO_ITAU = "Banco Itaú Corpbanca",
    BANCO_SCOTIABANK = "Scotiabank Chile",
    BANCO_CONSORCIO = "Banco Consorcio",
    BANCO_RIPLEY = "Banco Ripley",
    BANCO_INTERNACIONAL = "Banco Internacional",
    BANCO_BICE = "Banco BICE",
    BANCO_PARIS = "Banco Paris",
    BANCO_MERCADO_PAGO = "Banco Mercado Pago",
    OTRO = "Otro",
}

export interface PersonBankAccount {
    accountType: AccountTypeName;
    bank: BankName;
    accountNumber: string;
    alias?: string;
    isPrimary?: boolean;
}

@Entity("persons")
export class Person {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column()
    dni!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ nullable: true })
    mail!: string;

    @Column({ type: "json", nullable: true })
    bankAccounts?: PersonBankAccount[] | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
