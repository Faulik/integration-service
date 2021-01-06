import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity()
class OrderDetails {
  @Column()
  productId: number;

  @Column()
  name: string;

  @Column()
  quantity: number;

  @Column()
  weight: number;

  @Column()
  eanCode: string;
}

@Entity()
class OrderInformation {
  @Index('unique_order_ids', { unique: true })
  @Column()
  id: number;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  addressLine1: string;

  @Column()
  addressLine2: string;

  @Column()
  company: string;

  @Column()
  zipCode: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column()
  carrierKey: string;

  @Column()
  status: string;

  @Column(() => OrderDetails)
  details: OrderDetails[];
}

export enum OrderStatus {
  new = 'new',
  done = 'done',
  failed = 'failed',
  delivered = 'delivered',
}

@Entity()
export class Order {
  @ObjectIdColumn()
  _id: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.new,
  })
  status: OrderStatus;

  @Column(() => OrderInformation)
  order: OrderInformation;
}
