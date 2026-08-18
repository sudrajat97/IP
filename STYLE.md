# STYLE.md — Gaya Coding Project Ini

> Tiru contoh ✅ persis. Hindari pola ❌.
> Tujuannya bukan "kode paling keren", tapi **kode yang pemiliknya bisa baca dan debug sendiri**.
>
> _Sesuaikan contoh di bawah dengan gaya aslimu — ini template, bukan sabda._

---

## Prinsip Umum

1. Kode ditulis untuk dibaca manusia, bukan untuk pamer.
2. Satu fungsi = satu tanggung jawab, maksimal ~30 baris.
3. Eksplisit lebih baik daripada pintar. Tidak ada "magic".
4. Nama variabel dalam bahasa Inggris, camelCase, deskriptif.
5. Komentar hanya untuk menjelaskan **kenapa**, bukan **apa**.
6. Dilarang abstraksi prematur: tidak ada factory, decorator, atau generic
   helper sampai pola yang sama muncul minimal 3 kali.

---

## 1. Controller

✅ **BEGINI** — class dengan static method, try/catch, lempar ke `next()`:
```js
class AuthController {
    static async register(req, res, next) {
        try {
            const { email, password, role } = req.body
            const user = await User.create({
                email, password, role
            })
            res.status(201).json({
                message: "Success create new User",
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            })
        } catch (error) {
            next(error)
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body
            if (!email || !password) {
                throw { name: "BadRequest", message: "Please input email or password" }
            }

            const user = await User.findOne({
                where: {
                    email
                }
            })
            if (!user) {
                throw { name: "LoginError" }
            }

            const isValidPassword = comparePassword(password, user.password)
            if (!isValidPassword) {
                throw { name: "LoginError" }
            }

            const access_token = signToken({
                id: user.id,
                email: user.email,
                role: user.role
            })

            res.status(200).json({
                access_token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            })
        } catch (error) {
            next(error)
        }
    }
}

```

❌ **JANGAN BEGINI** — arrow function anonim, chaining padat, error ditelan:
```js
router.get('/products', (req, res) =>
  Product.findAll({ where: req.query.search ? { name: { [Op.iLike]: `%${req.query.search}%` } } : {} })
    .then(p => res.json(p))
    .catch(() => res.status(500).send('error')));
```

---

## 2. Error Handling

✅ **BEGINI** — lempar object bernama, ditangani terpusat:
```js
// di controller
if (!product) {
  throw { name: 'NotFound', message: 'Product tidak ditemukan' };
}

// middlewares/errorHandler.js
const errorHandler = (error, req, res, next) => {
    console.log(error);
    let status = 500
    let message = 'Internal Server Error'
    if (error.name === 'SequelizeValidationError') {
        status = 400
        message = error.errors[0].message
    }
    if (error.name == 'SequelizeUniqueConstraintError') {
        status = 400
        message = error.errors[0].message
    }
    if (error.name == 'BadRequest') {
        message = error.message || 'Please input email or password'
        status = 400
    }
    if (error.name == 'LoginError') {
        message = 'Invalid email or password'
        status = 401
    }
    if (error.name == 'Unauthorized' || error.name == 'JsonWebTokenError') {
        message = 'Please login first'
        status = 401
    }

    if (error.name == 'Forbidden') {
        message = 'You dont have any access'
        status = 403
    }

    if (error.name == 'NotFound') {
        status = 404
        message = error.message || `Data not found`
    }
    res.status(status).json({
        message
    })

}
```

❌ **JANGAN BEGINI** — `res.status()` berserakan di dalam controller, atau
`catch (e) { console.log(e) }` tanpa response.

---

## 3. Async/Await

✅ `await` dengan try/catch.
❌ `.then().catch()` berantai, callback bersarang, `Promise.all` tanpa penjelasan.

---

## 4. Transaksi Database

✅ **BEGINI** — eksplisit, rollback jelas:
```js
static async create(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const product = await Product.findByPk(ProductId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product) {
      throw { name: 'NotFound', message: 'Product tidak ditemukan' };
    }
    if (product.quantity < quantity) {
      throw { name: 'BadRequest', message: 'Stok tidak mencukupi' };
    }

    const quantityBefore = product.quantity;
    product.quantity = quantityBefore - quantity;
    await product.save({ transaction });

    await StockMovement.create({
      ProductId: product.id,
      type: 'sale',
      quantity,
      quantityBefore,
      quantityAfter: product.quantity,
      UserId: req.user.id,
    }, { transaction });

    await transaction.commit();
    res.status(201).json({ message: 'Sale recorded' });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
}
```

---

## 5. Middleware

✅ Satu file satu middleware, nama file = nama fungsi:
`middlewares/authentication.js`, `middlewares/authorization.js`, `middlewares/errorHandler.js`

```js
async function authentication(req, res, next) {
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
      throw { name: 'Unauthorized', message: 'Token tidak ditemukan' };
    }

    const token = bearerToken.split(' ')[1];
    const payload = verifyToken(token);

    const user = await User.findByPk(payload.id);
    if (!user) {
      throw { name: 'Unauthorized', message: 'Token tidak valid' };
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}
```

---

## 6. React Component

✅ **BEGINI** — function component, satu komponen satu file, state eksplisit:
```jsx
function ProductList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function fetchProducts() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Gagal memuat produk');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (errorMessage) return <p className="error">{errorMessage}</p>;

  return (
    <div className="product-list">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

❌ **JANGAN BEGINI** — custom hook untuk hal sepele, komponen 300 baris,
ternary bersarang di JSX, inline style object panjang, satu file berisi 5 komponen.
## 6b. Tailwind

- Maksimal ~8 utility class per elemen. Kalau lebih, ekstrak jadi komponen.
- Dilarang UI library di atas Tailwind (shadcn, daisyUI, Material Tailwind).
- Warna dan spacing pakai skala bawaan Tailwind, jangan nilai arbitrary seperti `w-[347px]`.

---

## 7. Penamaan

| Jenis | Aturan | Contoh |
|---|---|---|
| Variabel & fungsi | camelCase | `totalAmount`, `fetchProducts` |
| Boolean | awali `is`/`has`/`can` | `isLoading`, `hasStock` |
| Class & Component | PascalCase | `ProductController`, `ProductCard` |
| File model/controller | PascalCase | `ProductController.js` |
| File lain | camelCase | `errorHandler.js`, `api.js` |
| Konstanta env | UPPER_SNAKE | `JWT_SECRET` |

Dilarang singkatan tidak jelas: `p`, `d`, `tmp`, `data2`, `handleThing`.

---

## 8. Yang Dilarang Keras

- Chaining lebih dari 2 level dalam satu baris
- Ternary bersarang
- `var`
- `==` (pakai `===`)
- Menyimpan angka uang sebagai float
- Logic bisnis di dalam file route
- Query database langsung di dalam React component
- Menghapus atau mengomentari kode orang lain tanpa penjelasan di PR
