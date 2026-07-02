import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { ProductiveUnit } from "./ProductiveUnit";
import { Person } from "./Person";

@Entity("producers")
export class Producer {
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

    @Column({ type: 'varchar', length: 36 })
    productiveUnitId!: string;

    @Column({ type: 'varchar', length: 36 })
    personId!: string;

    @ManyToOne(() => ProductiveUnit)
    @JoinColumn({ name: 'productiveUnitId' })
    productiveUnit!: ProductiveUnit;

    @ManyToOne(() => Person)
    @JoinColumn({ name: 'personId' })
    person!: Person;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}