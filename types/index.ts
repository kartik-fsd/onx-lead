export interface TaskerDetails {
    name: string;
    phone: string;
}

export interface SellerDetails {
    sellerName: string;
    shopName: string;
    shopImage: string;
    gstNumber: string;
    sellerPhoneNumber: string;
    productCount: number,
}

export interface ProductDetails {
    name: string;
    mrp: string;
    msp: string;
    image1: string;
    image2: string;
    image3?: string;
}


export interface RegistrationData {
    taskerDetails: TaskerDetails;
    sellerDetails: SellerDetails;
    products: ProductDetails[];
}

