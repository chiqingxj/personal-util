import { useState, useEffect } from 'react';
import { Button, Checkbox } from 'antd';

const fs = window.require('fs');
const { dialog } = window.require('electron').remote;

function BulkUpdate() {
    const [codeDirPath, setCodeDirPath] = useState('');
    const [selectRepo, setSelectRepo] = useState([]);

    function selectCodeDir() {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }).then((res) => {
            const { canceled, filePaths } = res;
            if (canceled) {
                console.log('点击了取消选择');
            } else {
                console.log('选中了' + filePaths + '文件夹');
                setCodeDirPath(filePaths[0]);
            }
        }).catch((err) => {
            console.error(err);
        })
    }

    function renderRepoList() {
        if (!codeDirPath) return false;

        const repos = fs.readdirSync(codeDirPath) || [];

        const dirOptions = repos.map((repo) => ({ label: repo, value: repo}));

        return <Checkbox.Group
            options={dirOptions}
            onChange={(value) => setSelectRepo(value)}
        />;
    }

    return (
        <div className="bulk-update">
            {/*<div>*/}
            {/*    <label>选择文件夹：</label>*/}
            {/*    <input type="file" multiple="multiple" webkitdirectory directory />*/}
            {/*</div>*/}
            <Button type="primary" onClick={selectCodeDir}>选择文件夹</Button>

            { renderRepoList() }
        </div>
    )
}

export default BulkUpdate;
