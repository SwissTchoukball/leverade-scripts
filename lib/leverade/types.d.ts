import { RefereeLevel } from './enums';

export interface LeveradeResponseContent<T, E = {}> {
  data: T[];
  included?: E[];
  meta?: {
    pagination?: {
      count: number;
      per_page: number;
      current_page: number;
    };
  };
  links?: {
    self: string;
    first: string;
    next?: string;
  };
}

export interface LeveradeBaseEntity {
  type: string;
  id: string;
}

export interface LeveradeEntity extends LeveradeBaseEntity {
  attributes: {
    [key: string]: any;
  };
  meta: {
    [key: string]: any;
  };
  relationships: {
    [key: string]: { data: LeveradeBaseEntity | LeveradeBaseEntity[] | null };
  };
}

export interface LeveradeLicense extends LeveradeEntity {
  type: 'license';
  attributes: {
    type: 'executive' | 'player' | 'referee' | 'staff';
    expiration: string | null;
  };
  relationships: {
    profile: { data: LeveradeBaseEntity };
  };
}

export interface LeveradeRefereeLicense extends LeveradeLicense {
  type: 'license';
  attributes: {
    type: 'referee';
    custom_fields: {
      inactive: boolean;
    };
  };
  relationships: {
    refereecategory: { data: LeveradeBaseEntity };
    profile: { data: LeveradeBaseEntity };
    [key: string]: { data: LeveradeBaseEntity | LeveradeBaseEntity[] | null };
  };
}

export interface LeveradeProfile extends LeveradeEntity {
  type: 'profile';
  attributes: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    residence: string;
  };
}

export interface LeveradeRefereeCategory extends LeveradeEntity {
  type: 'refereecategory';
  attributes: {
    name: string;
  };
}

export interface Referee {
  id: string;
  inactive: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  residence: string;
  levelId: RefereeLevel;
}

export type LeveradeRefereeLicensesResponseContent = LeveradeResponseContent<
  LeveradeRefereeLicense,
  LeveradeProfile | LeveradeRefereeCategory
>;
