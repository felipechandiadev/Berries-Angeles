import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, DeleteDateColumn } from "typeorm";
import { Person } from "./Person";

export enum UserRole {
    ADMIN = 'ADMIN',
    OPERATOR = 'OPERATOR'
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    userName!: string;

    @Column()
    pass!: string;


    @Column()
    mail!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.OPERATOR
    })
    rol!: UserRole;

    @OneToOne(() => Person, { cascade: ['insert', 'update'], eager: true })
    @JoinColumn()
    person?: Person;

    @DeleteDateColumn()
    deletedAt?: Date;
}
