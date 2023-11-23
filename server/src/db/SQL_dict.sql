SELECT *
FROM rail_account_req_info;


SELECT *
FROM rail_current_account_info;


INSERT INTO rail_current_account_info(
        account,
        password,
        user_name,
        db_name,
        db_authority,
        req_time,
        passed_time,
        MongoDB_str,
        remarks
    )
VALUES ('1744909110','1woshicui999','ctr_temp_user','luckysheet','user', '1662436164130', '1662436172027', 'MongoDB_authentication_str', "remark_str");
-- VALUES ('1744909116','1woshicui999','ctr_temp_admin','luckysheet','admin', '1662436164130', '1662436172027', 'MongoDB_authentication_str', "remark_str");
-- VALUES ('15230245071','1woshicui999','ctr_temp_super_admin','luckysheet','super_admin', '1662436035156', '1662436043347', 'MongoDB_authentication_str', "remark_str");






-- VALUES ('13281170709','1woshicui999','ctr_temp','luckysheet','super_admin', '1662434946985', '1662435058162', 'temp');


INSERT INTO rail_account_req_info(
        account,
        password,
        user_name,
        req_db,
        req_authority,
        req_time,
        remarks
    )
values (
    '1744909111',
    '1woshicui999',
    'ctr_temp_user',
    'luckysheet',
    'user',
    '1662436164130',
    'temp'
);


DELETE FROM rail_current_account_info WHERE user_name = '';

DELETE FROM rail_account_req_info WHERE user_name = '';
