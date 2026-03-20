var express = require('express');
var router = express.Router();

let inventoryModel = require('../schemas/inventories');

function getPositiveQuantity(body) {
  let quantity = Number(body?.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  return quantity;
}

router.get('/', async function (req, res, next) {
  try {
    let result = await inventoryModel
      .find({})
      .populate({ path: 'product' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// get inventory by inventory id, join with product
router.get('/:id', async function (req, res, next) {
  try {
    let result = await inventoryModel
      .findOne({ _id: req.params.id })
      .populate({ path: 'product' });

    if (!result) {
      return res.status(404).send({ message: 'ID NOT FOUND' });
    }

    res.send(result);
  } catch (error) {
    res.status(404).send({ message: 'ID NOT FOUND' });
  }
});

// POST tăng stock tương ứng với quantity
router.post('/add_stock', async function (req, res, next) {
  try {
    let productId = req.body?.product;
    let quantity = getPositiveQuantity(req.body);
    if (!productId || quantity === null) {
      return res.status(400).send({ message: 'Invalid body' });
    }

    let result = await inventoryModel.findOneAndUpdate(
      { product: productId },
      { $inc: { stock: quantity } },
      { new: true }
    ).populate({ path: 'product' });

    if (!result) {
      return res.status(404).send({ message: 'Inventory not found' });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// POST giảm stock tương ứng với quantity
router.post('/remove_stock', async function (req, res, next) {
  try {
    let productId = req.body?.product;
    let quantity = getPositiveQuantity(req.body);
    if (!productId || quantity === null) {
      return res.status(400).send({ message: 'Invalid body' });
    }

    let result = await inventoryModel.findOneAndUpdate(
      { product: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true }
    ).populate({ path: 'product' });

    if (!result) {
      return res.status(400).send({ message: 'Not enough stock or inventory not found' });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// POST giảm stock và tăng reserved tương ứng với quantity
router.post('/reservation', async function (req, res, next) {
  try {
    let productId = req.body?.product;
    let quantity = getPositiveQuantity(req.body);
    if (!productId || quantity === null) {
      return res.status(400).send({ message: 'Invalid body' });
    }

    let result = await inventoryModel.findOneAndUpdate(
      { product: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity, reserved: quantity } },
      { new: true }
    ).populate({ path: 'product' });

    if (!result) {
      return res.status(400).send({ message: 'Not enough stock or inventory not found' });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// POST giảm reservation và tăng soldCount tương ứng với quantity
router.post('/sold', async function (req, res, next) {
  try {
    let productId = req.body?.product;
    let quantity = getPositiveQuantity(req.body);
    if (!productId || quantity === null) {
      return res.status(400).send({ message: 'Invalid body' });
    }

    let result = await inventoryModel.findOneAndUpdate(
      { product: productId, reserved: { $gte: quantity } },
      { $inc: { reserved: -quantity, soldCount: quantity } },
      { new: true }
    ).populate({ path: 'product' });

    if (!result) {
      return res.status(400).send({ message: 'Not enough reserved or inventory not found' });
    }

    res.send(result);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;

