// transaction(run) provides a private, read-committed Postgres transaction with a query method.
export function createPostgresPaymentLedger(transaction) {
  return {
    withPartner(partnerId, run) {
      return transaction(async (db) => {
        await db.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', ['payment:' + partnerId]);
        return run({
          async find(key) {
            const { rows: [journal] } = await db.query(
              `select journal_key as key, kind, partner_id as "partnerId", order_id as "orderId",
                      reference_scope as "referenceScope", external_reference as "externalReference"
                 from public.payment_journal where journal_key = $1`,
              [key],
            );
            if (!journal) return null;
            const { rows: transfers } = await db.query(
              `select debit_account as debit, credit_account as credit,
                      amount_paise::text as "amountPaise", component
                 from public.payment_transfer where journal_key = $1 order by line_no`,
              [key],
            );
            return { ...journal, transfers };
          },

          async partnerBalances() {
            const { rows: [balances] } = await db.query(
              `select coalesce(sum(case when t.credit_account = 'partner_payable' then t.amount_paise
                                        when t.debit_account = 'partner_payable' then -t.amount_paise else 0 end), 0)::text as "payablePaise",
                      coalesce(sum(case when t.debit_account = 'retailer_cash_due' then t.amount_paise
                                        when t.credit_account = 'retailer_cash_due' then -t.amount_paise else 0 end), 0)::text as "cashDuePaise"
                 from public.payment_journal j join public.payment_transfer t using (journal_key)
                where j.partner_id = $1`,
              [partnerId],
            );
            return balances;
          },

          async post(journal) {
            const { key, kind, orderId = null, referenceScope = null, externalReference = null, transfers } = journal;
            if (journal.partnerId !== partnerId || !transfers.length) throw new Error('Invalid journal.');
            await db.query(
              `insert into public.payment_journal (journal_key, kind, partner_id, order_id, reference_scope, external_reference)
               values ($1, $2, $3, $4, $5, $6)`,
              [key, kind, partnerId, orderId, referenceScope, externalReference],
            );
            await db.query(
              `insert into public.payment_transfer (journal_key, line_no, debit_account, credit_account, amount_paise, component)
               select $1, t.ordinality, t.item->>'debit', t.item->>'credit',
                      (t.item->>'amountPaise')::numeric, t.item->>'component'
                 from jsonb_array_elements($2::jsonb) with ordinality as t(item, ordinality)`,
              [key, JSON.stringify(transfers)],
            );
            return journal;
          },
        });
      });
    },
  };
}
