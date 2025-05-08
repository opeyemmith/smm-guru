export type HandlerTypes =
  | //   Service list
  {
      key: string;
      action: "services";
    }
  //   Add order
  | {
      key: string;
      action: "add";
      service: number;
      link: string;
      quantity: number;
    }
  // Order status
  | {
      key: string;
      action: "status";
      order: number;
    }
  //   Check user balance
  | {
      key: string;
      action: "balance";
    };
