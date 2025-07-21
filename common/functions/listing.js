// export const TablePagination = (req) => {
//     const page = req?.query?.page || 1;
//     const limit = req?.query?.limit || 15;
//     const offset = (page - 1) * limit;

//     return {
//         page, limit, offset
//     }

// }

// export const TableMeta = (total, req, offset) => {

//     const current_page = parseInt(req?.query?.page) || 1
//     const per_page = parseInt(req?.query?.limit) || 15
//     const from = offset + 1
//     const last_page = Math.ceil(total / per_page)
//     let to = offset + per_page
//     if (current_page * per_page > total) {
//         to = total+1
//     }

//     const meta = {
//         current_page,
//         from,
//         last_page,
//         per_page,
//         to,
//         total,
//     }

//     return meta

// }