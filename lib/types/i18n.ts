// lib/types/i18n.ts
export interface Resources {
  translation: {
    hero: {
      title: string;
      description: string;
      brought_by: string;
    };
    menu: {
      home: string;
      feature: string;
      solution: string;
      about: string;
    };
    features: {
      title: string;
      description: string;
      network: {
        title: string;
        description: string;
      };
      discover: {
        title: string;
        description: string;
      };
      enjoy: {
        title: string;
        description: string;
      };
    };
    solution: {
      title: string;
      description: string;
      financial_literacy: {
        title: string;
        description: string;
      };
      network: {
        title: string;
        description: string;
      };
    };
  };
}

declare module "react-i18next" {
  interface CustomTypeOptions {
    resources: Resources;
  }
}
