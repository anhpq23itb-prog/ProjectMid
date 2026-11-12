import {
  addDoc, collection, deleteDoc, doc, onSnapshot, setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type ProductFields = {
  name: string;
  price: number;
  soluong: number;
  hinhanh: string;
};

export type ProductRecord = ProductFields & { id: string };

export function validateProduct(values: ProductFields) {
  const errors: Partial<Record<keyof ProductFields, string>> = {};

  if (!values.name || values.name.length > 200) {
    errors.name = 'Nhập tên sản phẩm từ 1 đến 200 ký tự.';
  }
  if (typeof values.price !== 'number' || values.price < 0) {
    errors.price = 'Giá sản phẩm phải là số nguyên dương hoặc bằng 0.';
  }
  if (typeof values.soluong !== 'number' || values.soluong < 0) {
    errors.soluong = 'Số lượng sản phẩm phải là số nguyên dương hoặc bằng 0.';
  }

  const base64Regex = /^data:image\/(jpeg|png|jpg);base64,[A-Za-z0-9+/]+=*$/;
  if (!values.hinhanh) {
    errors.hinhanh = 'Chọn hình ảnh sản phẩm.';
  } else if (values.hinhanh.length > 220000) {
    errors.hinhanh = 'Dung lượng ảnh vượt quá kích thước cho phép.';
  } else if (!base64Regex.test(values.hinhanh)) {
    errors.hinhanh = 'Định dạng hình ảnh phải là chuỗi Base64 (jpeg, png, jpg).';
  }

  return errors;
}

function productsRef() {
  if (!db) throw new Error('Firestore chưa được cấu hình.');
  return collection(db, 'sanpham');
}

export function watchProducts(onProducts: (rows: ProductRecord[]) => void, onError: (error: Error) => void) {
  return onSnapshot(productsRef(), (snapshot) => {
    const rows = snapshot.docs.map((item) => ({ ...(item.data() as ProductFields), id: item.id }));
    rows.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    onProducts(rows);
  }, onError);
}

export class ProductRemoved extends Error {}

export async function saveProduct(values: ProductFields, id?: string) {
  if (!db) throw new Error('Firestore chưa được cấu hình.');
  const records = productsRef();

  if (id) {
    const target = doc(records, id);
    await setDoc(target, values, { merge: true });
  } else {
    await addDoc(records, values);
  }
}

export function removeProduct(id: string) {
  return deleteDoc(doc(productsRef(), id));
}