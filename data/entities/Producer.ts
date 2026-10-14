import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
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
    personId!: string;

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
