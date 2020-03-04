module.exports = {
    parseCookies(str) {
        let cookies = str.headers.cookie.split('; ')

        for (let i = 0; i < cookies.length; i++) {
            if (cookies[i].includes('JudaAuthToken')) {
                let name = cookies[i].split("=")[0];
                let val = cookies[i].split("=")[1];
                return val;
            }
        }
        return null;
    },

    getPublicUserData(usersOnline) {
        let publicUsersData = []
        for (const [key, value] of Object.entries(usersOnline)) {
            publicUsersData.push({
                username: value.username,
                rank: value.rank
            })
        }
        return publicUsersData
    }


}