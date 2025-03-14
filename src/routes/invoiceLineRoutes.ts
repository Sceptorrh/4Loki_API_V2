/**
 * @swagger
 * /invoice-lines:
 *   post:
 *     summary: Create a new invoice line
 *     tags: [Invoice Lines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceLineInput'
 *     responses:
 *       201:
 *         description: Created invoice line
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceLine'
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /invoice-lines/{id}:
 *   put:
 *     summary: Update an invoice line
 *     tags: [Invoice Lines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice Line ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceLineInput'
 *     responses:
 *       200:
 *         description: Updated invoice line
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceLine'
 *       404:
 *         description: Invoice line not found
 *       400:
 *         description: Invalid input
 */ 