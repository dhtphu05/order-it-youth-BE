
export interface PaymentInitResult {
    payment_ref?: string;
    provider_payload?: any;
    qr_data?: string;
    checkout_url?: string; // Future use
}

export interface PaymentProvider {
    createPayment(input: {
        donationCode: string;
        amount: number;
        description: string;
        buyerName?: string;
        buyerPhone?: string;
    }): Promise<PaymentInitResult>;
}
