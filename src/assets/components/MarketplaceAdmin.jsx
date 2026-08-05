import { useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../../firebase/config";

import {
  ShieldCheck,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Crown,
  MoreVertical,
  Eye,
  Package,
  Users,
  Clock3,
  TrendingUp,
  BadgeCheck,
  Pencil,
  Filter,
  ShoppingBag,
} from "lucide-react";

export default function MarketplaceAdmin({
  dark,
}) {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [activeMenu, setActiveMenu] =
    useState(null);

  const bg = dark
    ? "bg-[#070b14] text-white"
    : "bg-[#f5f7fb] text-gray-900";

  const card = dark
    ? "bg-white/5 border border-white/10 backdrop-blur-xl"
    : "bg-white border border-gray-200 shadow-sm";

  /* =========================================
     FETCH
  ========================================= */

  const fetchItems =
    async () => {
      setLoading(true);

      try {
        const q = query(
          collection(
            db,
            "studentMarketplace"
          ),
          orderBy(
            "createdAt",
            "desc"
          )
        );

        const snap =
          await getDocs(q);

        setItems(
          snap.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          )
        );
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

  useEffect(() => {
    fetchItems();
  }, []);

  /* =========================================
     FILTER
  ========================================= */

  const filteredItems =
    useMemo(() => {
      return items.filter(
        (item) => {
          const matchesSearch =
            item.title
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            item.category
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesStatus =
            statusFilter ===
            "all"
              ? true
              : item.status ===
                statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      items,
      search,
      statusFilter,
    ]);

  /* =========================================
     STATS
  ========================================= */

  const stats =
    useMemo(() => {
      return {
        total:
          items.length,

        approved:
          items.filter(
            (i) =>
              i.status ===
              "approved"
          ).length,

        pending:
          items.filter(
            (i) =>
              i.status ===
              "pending"
          ).length,

        premium:
          items.filter(
            (i) =>
              i.premiumUser
          ).length,
      };
    }, [items]);

  /* =========================================
     APPROVE
  ========================================= */

  const approveItem =
    async (id) => {
      try {
        await updateDoc(
          doc(
            db,
            "studentMarketplace",
            id
          ),
          {
            status:
              "approved",
          }
        );

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status:
                    "approved",
                }
              : item
          )
        );
      } catch (err) {
        console.log(err);
      }
    };

  /* =========================================
     REJECT
  ========================================= */

  const rejectItem =
    async (id) => {
      try {
        await updateDoc(
          doc(
            db,
            "studentMarketplace",
            id
          ),
          {
            status:
              "rejected",
          }
        );

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status:
                    "rejected",
                }
              : item
          )
        );
      } catch (err) {
        console.log(err);
      }
    };

  /* =========================================
     DELETE
  ========================================= */

  const deleteItem =
    async (id) => {
      const confirmDelete =
        window.confirm(
          "Delete this product?"
        );

      if (
        !confirmDelete
      )
        return;

      try {
        await deleteDoc(
          doc(
            db,
            "studentMarketplace",
            id
          )
        );

        setItems((prev) =>
          prev.filter(
            (item) =>
              item.id !== id
          )
        );
      } catch (err) {
        console.log(err);
      }
    };

  return (
    <div
      className={`min-h-screen w-full px-4 md:px-8 py-6 ${bg}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

          <div className="flex items-center gap-4">

            <div className="h-16 w-16 rounded-3xl text-white bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <ShieldCheck size={30} />
            </div>

            <div>
              <h1 className="text-3xl font-black">
                Marketplace Admin
              </h1>

              <p className="opacity-70 text-sm">
                Manage all products,
                approvals &
                reports
              </p>
            </div>
          </div>

          <div
            className={`${card} rounded-3xl px-5 py-4 flex items-center gap-3`}
          >
            <TrendingUp className="text-emerald-500" />

            <div>
              <p className="font-semibold">
                Live Marketplace
              </p>

              <p className="text-xs opacity-70">
                Admin Control Panel
              </p>
            </div>
          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div
            className={`${card} rounded-3xl p-5`}
          >
            <div className="flex justify-between">
              <Package className="text-indigo-500" />

              <span className="text-xs opacity-60">
                Total
              </span>
            </div>

            <h2 className="text-3xl font-black mt-4">
              {stats.total}
            </h2>
          </div>

          <div
            className={`${card} rounded-3xl p-5`}
          >
            <div className="flex justify-between">
              <CheckCircle2 className="text-green-500" />

              <span className="text-xs opacity-60">
                Approved
              </span>
            </div>

            <h2 className="text-3xl font-black mt-4">
              {stats.approved}
            </h2>
          </div>

          <div
            className={`${card} rounded-3xl p-5`}
          >
            <div className="flex justify-between">
              <Clock3 className="text-yellow-500" />

              <span className="text-xs opacity-60">
                Pending
              </span>
            </div>

            <h2 className="text-3xl font-black mt-4">
              {stats.pending}
            </h2>
          </div>

          <div
            className={`${card} rounded-3xl p-5`}
          >
            <div className="flex justify-between">
              <Crown className="text-orange-400" />

              <span className="text-xs opacity-60">
                Premium
              </span>
            </div>

            <h2 className="text-3xl font-black mt-4">
              {stats.premium}
            </h2>
          </div>
        </div>

        {/* FILTER */}

        <div
          className={`${card} rounded-3xl p-4 flex flex-col md:flex-row gap-4`}
        >
          <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <Search size={18} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search products..."
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5">
            <Filter size={18} />

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="bg-transparent outline-none text-sm"
            >
              <option value="all">
                All
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {filteredItems.map(
              (item) => (
                <div
                  key={item.id}
                  className={`${card} rounded-3xl overflow-hidden relative`}
                >
                  {/* IMAGE */}

                  <div className="relative">
                    <img
                      src={
                        item
                          .images?.[0]
                      }
                      alt=""
                      className="h-56 w-full object-cover"
                    />

                    {/* STATUS */}

                    <div className="absolute top-3 left-3">

                      {item.status ===
                        "approved" && (
                        <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                          Approved
                        </div>
                      )}

                      {item.status ===
                        "pending" && (
                        <div className="bg-yellow-500 text-black text-xs px-3 py-1 rounded-full">
                          Pending
                        </div>
                      )}

                      {item.status ===
                        "rejected" && (
                        <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                          Rejected
                        </div>
                      )}
                    </div>

                    {/* PREMIUM */}

                    {item.premiumUser && (
                      <div className="absolute top-3 right-14 bg-orange-500 text-white p-2 rounded-full">
                        <Crown size={14} />
                      </div>
                    )}

                    {/* MENU */}

                    <div className="absolute top-3 right-3">

                      <button
                        onClick={() =>
                          setActiveMenu(
                            activeMenu ===
                              item.id
                              ? null
                              : item.id
                          )
                        }
                        className="bg-black/60 text-white p-2 rounded-full"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenu ===
                        item.id && (
                        <div className="absolute right-0 mt-2 w-44 rounded-2xl overflow-hidden bg-[#111827] border border-white/10 shadow-2xl z-50">

                          <button
                            onClick={() => {
                              setSelectedItem(
                                item
                              );

                              setActiveMenu(
                                null
                              );
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-2 text-sm"
                          >
                            <Eye size={15} />
                            View Details
                          </button>

                          <button
                            onClick={() =>
                              approveItem(
                                item.id
                              )
                            }
                            className="w-full px-4 py-3 text-left hover:bg-green-500/20 text-green-400 flex items-center gap-2 text-sm"
                          >
                            <BadgeCheck size={15} />
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              rejectItem(
                                item.id
                              )
                            }
                            className="w-full px-4 py-3 text-left hover:bg-yellow-500/20 text-yellow-400 flex items-center gap-2 text-sm"
                          >
                            <XCircle size={15} />
                            Reject
                          </button>

                          <button
                            onClick={() =>
                              deleteItem(
                                item.id
                              )
                            }
                            className="w-full px-4 py-3 text-left hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-sm"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BODY */}

                  <div className="p-5 space-y-4">

                    <div className="flex justify-between gap-3">

                      <div>
                        <h2 className="font-bold text-lg line-clamp-1">
                          {
                            item.title
                          }
                        </h2>

                        <p className="text-xs opacity-60">
                          {
                            item.category
                          }
                        </p>
                      </div>

                      <div className="text-indigo-500 font-black">
                        ₦
                        {
                          item.price
                        }
                      </div>
                    </div>

                    <p className="text-sm opacity-70 line-clamp-2">
                      {
                        item.description
                      }
                    </p>

                    <div className="flex items-center justify-between pt-2">

                      <div className="flex items-center gap-2 text-xs opacity-70">
                        <Users size={14} />
                        Seller
                      </div>

                      <button
                        onClick={() =>
                          setSelectedItem(
                            item
                          )
                        }
                        className="text-sm bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* DETAILS MODAL */}

        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

            <div
              className={`${card} w-full max-w-3xl rounded-3xl overflow-hidden`}
            >
              <div className="grid md:grid-cols-2">

                {/* IMAGE */}

                <div className="relative">
                  <img
                    src={
                      selectedItem
                        .images?.[0]
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* DETAILS */}

                <div className="p-6 space-y-5">

                  <div className="flex justify-between items-start">

                    <div>
                      <h2 className="text-2xl font-black">
                        {
                          selectedItem.title
                        }
                      </h2>

                      <p className="opacity-70 text-sm">
                        {
                          selectedItem.category
                        }
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedItem(
                          null
                        )
                      }
                    >
                      <XCircle />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">

                    <div
                      className={`${card} rounded-2xl p-4`}
                    >
                      <p className="opacity-60 text-xs mb-1">
                        Description
                      </p>

                      <p>
                        {
                          selectedItem.description
                        }
                      </p>
                    </div>

                    <div
                      className={`${card} rounded-2xl p-4`}
                    >
                      <p className="opacity-60 text-xs mb-1">
                        Price
                      </p>

                      <p className="font-bold text-xl text-indigo-500">
                        ₦
                        {
                          selectedItem.price
                        }
                      </p>
                    </div>

                    <div
                      className={`${card} rounded-2xl p-4`}
                    >
                      <p className="opacity-60 text-xs mb-1">
                        WhatsApp
                      </p>

                      <p>
                        {
                          selectedItem.phone
                        }
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="grid grid-cols-3 gap-3 pt-3">

                    <button
                      onClick={() =>
                        approveItem(
                          selectedItem.id
                        )
                      }
                      className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl text-sm font-semibold"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        rejectItem(
                          selectedItem.id
                        )
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-2xl text-sm font-semibold"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() =>
                        deleteItem(
                          selectedItem.id
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}