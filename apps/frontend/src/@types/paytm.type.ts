export interface PaytmTransactionResponse {
    TXNID: string;            // Paytm transaction ID
    BANKTXNID: string;        // Bank transaction ID
    ORDERID: string;          // Order ID
    TXNAMOUNT: string;        // Transaction amount
    STATUS: string;           // Transaction status (e.g., "TXN_SUCCESS")
    TXNTYPE: string;          // Transaction type (e.g., "SALE")
    GATEWAYNAME: string;      // Gateway name (e.g., "PPBL")
    RESPCODE: string;         // Response code
    RESPMSG: string;          // Response message
    MID: string;              // Merchant ID
    PAYMENTMODE: string;      // Payment mode (e.g., "UPI")
    REFUNDAMT: string;        // Refund amount
    TXNDATE: string;          // Transaction date and time
    POS_ID: string;           // POS ID
    UDF_1: string;            // User defined field 1
    currentTxnCount: string;  // Current transaction count
  }