import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { changePassword as changePasswordApi, getHistory, updateProfile as updateProfileApi } from '../api/auth'
import { cancelMyReservation } from '../api/reservations'
import CancelReservationModal from '../components/CancelReservationModal'

const STATUS_COLOR = {
  pending: 'bg-gold/15 text-gold-dark',
  confirmed: 'bg-jade-700/10 text-jade-700',
  seated: 'bg-jade-700/15 text-jade-700',
  completed: 'bg-jade-700/10 text-jade-700',
  cancelled: 'bg-lacquer/10 text-lacquer',
  no_show: 'bg-lacquer/10 text-lacquer',
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export default function Account() {
  const { user, isAuthenticated, updateProfile, logout, refreshProfile } = useAuth()
  const { t } = useLanguage()

  const tabs = [
    { key: 'profile', label: t('account.tabs.profile') },
    { key: 'reservations', label: t('account.tabs.reservations') },
    { key: 'password', label: t('account.tabs.password') },
  ]

  const statusLabel = {
    pending: t('account.statuses.pending'),
    confirmed: t('account.statuses.confirmed'),
    seated: t('account.statuses.seated'),
    completed: t('account.statuses.completed'),
    cancelled: t('account.statuses.cancelled'),
    no_show: t('account.statuses.no_show'),
  }

  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [savedMsg, setSavedMsg] = useState('')
  const [history, setHistory] = useState({ reservations: [] })
  const [cancelModal, setCancelModal] = useState({ isOpen: false, reservation: null })
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchUserHistory = () => {
    if (!user?.accessToken) return
    getHistory()
      .then(({ data }) => setHistory(data))
      .catch(() => setHistory({ reservations: [] }))
  }

  useEffect(() => {
    refreshProfile()
    fetchUserHistory()
  }, [user?.accessToken])

  useEffect(() => {
    setProfile({ fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '' })
  }, [user?.fullName, user?.email, user?.phone])

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" state={{ from: '/tai-khoan' }} replace />
  }

  const openCancelModal = (r) => {
    setCancelModal({ isOpen: true, reservation: r })
  }

  const closeCancelModal = () => {
    setCancelModal({ isOpen: false, reservation: null })
  }

  const handleCancelConfirm = async (id, reason) => {
    setCancelLoading(true)
    try {
      await cancelMyReservation(id, reason)
      setSavedMsg(t('account.cancelSuccess'))
      setTimeout(() => setSavedMsg(''), 3000)
      fetchUserHistory()
      closeCancelModal()
    } catch (err) {
      setSavedMsg(err.response?.data?.message || t('common.error'))
      setTimeout(() => setSavedMsg(''), 4000)
    } finally {
      setCancelLoading(false)
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      const { data } = await updateProfileApi(profile)
      updateProfile(data)
      setSavedMsg(t('account.updateSuccess'))
    } catch (err) {
      const message = err?.response?.data?.message || t('common.error')
      setSavedMsg(message)
    }
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.next.length < 6) {
      setSavedMsg(t('auth.errMinPassword'))
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setSavedMsg(t('auth.errMismatchPassword'))
      return
    }
    try {
      await changePasswordApi({ currentPassword: passwordForm.current, newPassword: passwordForm.next })
      setPasswordForm({ current: '', next: '', confirm: '' })
      setSavedMsg(t('account.passwordSuccess'))
    } catch (err) {
      const message = err?.response?.data?.message || t('common.error')
      setSavedMsg(message)
    }
    setTimeout(() => setSavedMsg(''), 2500)
  }

  return (
    <section className="bg-ivory py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center gap-3 text-center"
        >
          <motion.span
            variants={fadeInUp}
            animate={{ boxShadow: ['0 0 0 0 rgba(11,57,49,0)', '0 0 0 10px rgba(11,57,49,0.06)', '0 0 0 0 rgba(11,57,49,0)'] }}
            transition={{ boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-jade-700 font-display text-2xl text-gold-light"
          >
            {user?.fullName ? user.fullName[0] : 'U'}
          </motion.span>
          <motion.h1 variants={fadeInUp} className="font-display text-2xl font-semibold text-jade-700">
            {user?.fullName || t('account.title')}
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-sm text-ink-soft">
            {user?.email}
          </motion.p>
          <motion.button variants={fadeInUp} onClick={logout} className="mt-1 text-xs font-semibold text-lacquer hover:underline">
            {t('auth.logout')}
          </motion.button>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-4"
        >
          {/* TABS */}
          <motion.div variants={fadeInUp} className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
            {tabs.map((tItem) => (
              <button
                key={tItem.key}
                onClick={() => { setTab(tItem.key); setSavedMsg('') }}
                className={`relative whitespace-nowrap rounded-full px-5 py-2.5 text-left text-sm font-semibold transition-colors lg:rounded-lg ${
                  tab === tItem.key ? 'text-ivory' : 'bg-ivory-deep text-ink-soft hover:bg-jade-50'
                }`}
              >
                {tab === tItem.key && (
                  <motion.span
                    layoutId="account-tab-active"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-jade-700 lg:rounded-lg"
                  />
                )}
                <span className="relative z-10">{tItem.label}</span>
              </button>
            ))}
          </motion.div>

          {/* CONTENT */}
          <div className="lg:col-span-3">
            <AnimatePresence>
              {savedMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 overflow-hidden rounded-lg bg-jade-700/10 px-4 py-2.5 text-sm font-medium text-jade-700"
                >
                  {savedMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {tab === 'profile' && (
                <motion.form
                  key="profile"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={saveProfile}
                  className="space-y-4 rounded-xl2 bg-ivory-deep p-6 shadow-card sm:p-8"
                >
                  <div>
                    <label className="text-xs font-medium text-ink-soft">{t('auth.fullName')}</label>
                    <input
                      value={profile.fullName}
                      onChange={(e) => setProfile((v) => ({ ...v, fullName: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-soft">{t('auth.emailOrPhone')}</label>
                    <input
                      value={profile.email}
                      onChange={(e) => setProfile((v) => ({ ...v, email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-soft">{t('auth.phone')}</label>
                    <input
                      value={profile.phone}
                      onChange={(e) => setProfile((v) => ({ ...v, phone: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="rounded-full bg-jade-700 px-7 py-2.5 text-sm font-semibold text-ivory hover:bg-jade-600"
                  >
                    {t('account.saveProfile')}
                  </motion.button>
                </motion.form>
              )}

              {tab === 'reservations' && (
                <motion.div
                  key="reservations"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {(!history.reservations || history.reservations.length === 0) && (
                    <p className="rounded-xl2 bg-ivory-deep p-6 text-center text-sm text-ink-soft shadow-card">
                      {t('account.noReservations')}
                    </p>
                  )}

                  <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-4">
                    {(history.reservations || []).map((r) => (
                      <motion.div
                        key={r.id}
                        variants={fadeInUp}
                        whileHover={{ y: -3 }}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 bg-ivory-deep p-5 shadow-card transition-shadow hover:shadow-md"
                      >
                        <div>
                          <p className="font-display text-base font-semibold text-jade-700">{t('account.table')} #{r.id}</p>
                          <p className="mt-1 text-sm text-ink-soft">{r.date} lúc {r.time} · {r.guests} {t('account.guests')}</p>
                          {r.cancelReason && (
                            <p className="mt-1 text-xs italic text-lacquer">Lý do: {r.cancelReason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[r.status] || 'bg-gold/15 text-gold-dark'}`}>
                            {statusLabel[r.status] || r.status}
                          </span>
                          {(r.status === 'pending' || r.status === 'confirmed') && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => openCancelModal(r)}
                              className="rounded-full border border-lacquer/30 px-3 py-1 text-xs font-semibold text-lacquer hover:bg-lacquer/10"
                            >
                              {t('account.cancelBtn')}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  <Link to="/dat-ban" className="inline-block text-sm font-semibold text-jade-700 underline decoration-gold underline-offset-4">
                    + {t('account.bookNow')}
                  </Link>
                </motion.div>
              )}

              {tab === 'password' && (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={changePassword}
                  className="space-y-4 rounded-xl2 bg-ivory-deep p-6 shadow-card sm:p-8"
                >
                  <div>
                    <label className="text-xs font-medium text-ink-soft">{t('account.currentPassword')}</label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm((v) => ({ ...v, current: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-soft">{t('account.newPassword')}</label>
                    <input
                      type="password"
                      value={passwordForm.next}
                      onChange={(e) => setPasswordForm((v) => ({ ...v, next: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-soft">{t('account.confirmNewPassword')}</label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm((v) => ({ ...v, confirm: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="rounded-full bg-jade-700 px-7 py-2.5 text-sm font-semibold text-ivory hover:bg-jade-600"
                  >
                    {t('account.savePassword')}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <CancelReservationModal
        isOpen={cancelModal.isOpen}
        onClose={closeCancelModal}
        onConfirm={handleCancelConfirm}
        reservation={cancelModal.reservation}
        loading={cancelLoading}
      />
    </section>
  )
}