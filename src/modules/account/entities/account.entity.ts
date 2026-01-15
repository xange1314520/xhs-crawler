import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AccountStatus } from '../enums/account-status.enum';

/**
 * 账号实体
 * 存储小红书账号的Cookie和使用情况
 */
@Entity('accounts')
export class Account {
  @PrimaryColumn('varchar', { length: 36, comment: '账号ID（UUID）' })
  id: string;

  @Column('varchar', { length: 100, comment: '账号名称' })
  name: string;

  @Column('text', { comment: '账号Cookie' })
  cookie: string;

  @Column('varchar', {
    length: 20,
    default: AccountStatus.ACTIVE,
    comment: '账号状态',
  })
  status: AccountStatus;

  @Column('int', { default: 0, comment: '请求次数' })
  requestCount: number;

  @Column('datetime', { nullable: true, comment: '最后使用时间' })
  lastUsedAt: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
