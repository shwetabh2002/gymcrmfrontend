import styles from "./FeatureMoments.module.css";

/** Mini CRM fragments — visual proof under the desk. */
export default function FeatureMoments() {
  return (
    <div className={styles.wrap}>
      <article className={styles.row}>
        <div className={styles.copy}>
          <span className={styles.n}>01</span>
          <h3 className={styles.title}>Renewals don’t ghost you</h3>
          <p className={styles.body}>
            Expiry queue shows who is due, who promised, and who vanished — so
            your desk calls the right person first.
          </p>
        </div>
        <div className={styles.visual} aria-hidden>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span>Expiry queue</span>
              <span className={styles.badgeWarn}>3 at risk</span>
            </div>
            <div className={styles.queueRow}>
              <span className={styles.avatar}>RM</span>
              <div>
                <strong>Rohan Kulkarni</strong>
                <em>Expires today</em>
              </div>
              <span className={styles.pillDanger}>At risk</span>
            </div>
            <div className={styles.queueRow}>
              <span className={styles.avatar}>PS</span>
              <div>
                <strong>Priya Shah</strong>
                <em>In 4 days</em>
              </div>
              <span className={styles.pill}>Follow up</span>
            </div>
            <div className={styles.queueRow}>
              <span className={styles.avatar}>AM</span>
              <div>
                <strong>Aarav Mehta</strong>
                <em>Promised ₹4,999</em>
              </div>
              <span className={styles.pillOk}>Promised</span>
            </div>
          </div>
        </div>
      </article>

      <article className={`${styles.row} ${styles.rowFlip}`}>
        <div className={styles.copy}>
          <span className={styles.n}>02</span>
          <h3 className={styles.title}>Money with a name on it</h3>
          <p className={styles.body}>
            Cash, UPI, card. Every payment linked to a member and the staffer
            who took it. Dues stay visible until cleared.
          </p>
        </div>
        <div className={styles.visual} aria-hidden>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span>Today’s collections</span>
              <span className={styles.amount}>₹48,200</span>
            </div>
            <div className={styles.payRow}>
              <div>
                <strong>Neha Iyer</strong>
                <em>UPI · Desk · Ananya</em>
              </div>
              <span className={styles.money}>₹2,999</span>
            </div>
            <div className={styles.payRow}>
              <div>
                <strong>Vikram Rao</strong>
                <em>Cash · Trainer · Kabir</em>
              </div>
              <span className={styles.money}>₹4,999</span>
            </div>
            <div className={styles.payRowMuted}>
              <div>
                <strong>Due · Sana Kapoor</strong>
                <em>Plan expired · 2 days</em>
              </div>
              <span className={styles.due}>₹3,499</span>
            </div>
          </div>
        </div>
      </article>

      <article className={styles.row}>
        <div className={styles.copy}>
          <span className={styles.n}>03</span>
          <h3 className={styles.title}>Staff that can’t break the books</h3>
          <p className={styles.body}>
            Trainers sell. Desk collects. Owners see all. Permissions keep
            curiosity out of your ledger.
          </p>
        </div>
        <div className={styles.visual} aria-hidden>
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span>Roles</span>
              <span className={styles.badgeOk}>Locked down</span>
            </div>
            <div className={styles.roleRow}>
              <span className={styles.roleName}>Owner</span>
              <span className={styles.rolePerms}>All modules · Ledger · Staff</span>
            </div>
            <div className={styles.roleRow}>
              <span className={styles.roleName}>Desk</span>
              <span className={styles.rolePerms}>Members · Collect · Renewals</span>
            </div>
            <div className={styles.roleRowDim}>
              <span className={styles.roleName}>Trainer</span>
              <span className={styles.rolePerms}>Sell plans · No ledger access</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
