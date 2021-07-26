import React, { useState, useEffect } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { Button, Checkbox, List, Input, Modal, message, Timeline  } from 'antd';

const fs = window.require('fs');
const path = window.require('path');
const shell = require('shelljs');
const { dialog } = window.require('electron').remote;

function BulkUpdate() {
    const [libName, setLibName] = useState('');
    const [version, setVersion] = useState('');
    const [branch, setBranch] = useState('');

    const originReg = /\"\@xiaoe\/lead-group\"\:\s\"(.*)\-t0802\"/g;
    const replaceStr = '"@xiaoe/lead-group": "0.3.27-t0802"';

    const [codeDirPath, setCodeDirPath] = useState('');
    const [repoList, setRepoList] = useState([]);
    const [selectRepo, setSelectRepo] = useState([]);
    const [checkAll, setCheckAll] = useState(false);

    const [visible, setVisible] = useState(false);

    const [processVisible, setProcessVisible] = useState(false);
    const [processContentArr, setProcessContentArr] = useState([]);

    useEffect(() => {
        getRepoList();
        setCheckAll(false);
    }, [codeDirPath]);

    useDeepCompareEffect(() => {
        const isCheckAll = selectRepo.length === repoList.length;
        setCheckAll(isCheckAll);
    }, [selectRepo]);

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

    function getRepoList() {
        if (!codeDirPath) return false;

        const repos = fs.readdirSync(codeDirPath) || [];
        setRepoList(repos);
    }

    function onCheckAllChange(e) {
        setSelectRepo(e.target.checked ? [...repoList] : []);
        setCheckAll(e.target.checked);
    }

    function onCheckItemChange(e) {
        const { checked, value } = e.target;

        if (checked) {
            setSelectRepo([...selectRepo, value]);
        } else {
            setSelectRepo([...selectRepo].filter((i) => i !== value));
        }
    }

    function renderRepoList() {
        const dirOptions = repoList.map((repo) => ({ label: repo, value: repo}));

        if (!dirOptions.length) return false;

        return <List
                header={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Checkbox indeterminate={false} checked={checkAll} onChange={onCheckAllChange}>全选</Checkbox>
                        <Button type="primary" onClick={handleUpdate}>更新</Button>
                    </div>
                }
                bordered
                style={{ marginTop: 20, height: 400, overflow: 'auto' }}
            >
                <Checkbox.Group value={selectRepo}>
                    {
                        dirOptions.map(({label, value}) => <List.Item>
                            <Checkbox value={value} key={value} onChange={onCheckItemChange}>{label}</Checkbox>
                        </List.Item>)
                    }
                </Checkbox.Group>
            </List>
    }

    function handleUpdate() {
        if (!libName) {
            message.warning('请先填写待更新的依赖名称！');
            return false;
        }

        if (!version) {
            message.warning('请先填写待更新的依赖版本！');
            return false;
        }

        if (!branch) {
            message.warning('请先填写待更新的分支名！');
            return false;
        }

        if (!selectRepo.length) {
            message.warning('请选择需要更新的仓库！');
            return false;
        }

        setVisible(true);
    }

    function updateProcessContentArr(str = '', index) {
        const contentArr = [...processContentArr][index];
        const content = processContentArr[index] + str + '\n';
        contentArr[index] = content;
        setProcessContentArr(contentArr);
    }

    function checkLastRepo(index) {
        if (index === selectRepo.length - 1) {
            updateProcessContentArr('所有操作执行完毕！', index + 1);
            shell.exit();
        }
    }

    function handleConfirm() {
        setProcessVisible(true);

        selectRepo.forEach(async (repo, index) => {
            const filePath = path.resolve(codeDirPath, repo, './package.json');

            if (!fs.existsSync(filePath)) {
                updateProcessContentArr(`error: 找不到 ${repo}/package.json 文件!`, index);
                checkLastRepo();
                return false;
            }

            // 进入项目，拉取最新代码
            shell.cd(`${codeDirPath}/${repo}`);
            updateProcessContentArr(`当前项目为：${repo}，即将执行更新操作...`, index);

            const curBranch = shell.exec('git symbolic-ref --short HEAD').stdout.trim();
            updateProcessContentArr(`${repo} 当前分支为: ${curBranch}`, index);

            if (curBranch !== branch) {
                shell.exec(`git fetch`);
                const switchBranch = shell.exec(`git checkout -B ${gitBranch} origin/${gitBranch}`).stdout;

                if (!switchBranch) {
                    console.log(chalk.red(`error: 找不到 ${repo} ${gitBranch} 分支!`));
                }
            }

            const status = shell.exec(`git status`).stdout;

            if (!status.includes('nothing to commit, working tree clean')) {
                shell.exec(`git reset HEAD~`);
                shell.exec(`git checkout .`);
            }

            shell.exec(`git pull origin ${gitBranch}`);

            // readFileSync 方法读取文件内容
            const fileData = fs.readFileSync(filePath, 'utf-8');
            const replaceData = fileData.replace(originReg, replaceStr);

            if (fileData !== replaceData) {
                fs.writeFileSync(filePath, replaceData, 'utf-8');

                console.log(chalk.yellow(`${repo}/package.json 文件内容已修改!`));

                shell.exec(`git add package.json`);
                shell.exec(`git commit -m "feat: :arrow_up: lead-group"`);
                shell.exec(`git push origin head`);

                console.log(chalk.green(`${repo} 更新操作执行成功！更新内容：@xiaoe/lead-group 升级到 0.3.27-t0802 测试包`));
            } else {
                shell.exec(`git status`);
                console.log(chalk.green(`${repo} 中的 @xiaoe/lead-group 已更新到最新版本!`));
            }

            checkLastRepo(index);
        });
    }

    return (
        <div className="bulk-update">
            <label>依赖名称：</label>
            <Input
                value={libName}
                maxLength={20}
                showCount={true}
                onChange={(e) => setLibName(e.target.value.trim())}
            />
            { libName }
            <br/>

            <label>待更新版本：</label>
            <Input
                value={version}
                maxLength={20}
                showCount={true}
                onChange={(e) => setVersion(e.target.value.trim())}
            />
            { version }
            <br/>

            <label>待更新分支：</label>
            <Input
                value={branch}
                maxLength={20}
                showCount={true}
                onChange={(e) => setBranch(e.target.value.trim())}
            />
            { branch }
            <br/>

            <Button type="primary" style={{ marginTop: 20 }} onClick={selectCodeDir}>选择文件夹</Button>
            { renderRepoList() }

            <Modal
                title={`更新以下仓库的${libName}到${version}版本`}
                visible={visible}
                centered={true}
                okText={"确定"}
                cancelText={"取消"}
                onOk={handleConfirm}
                onCancel={() => setVisible(false)}
            >
                {
                    selectRepo.map((repo) => <p>{repo}</p>)
                }
            </Modal>

            <Modal
                title={"更新依赖中"}
                closable={false}
                visible={processVisible}
                footer={() => (
                    <Button>确定</Button>
                )}
            >
                <Timeline>
                    { processContentArr.map((content) => <Timeline.Item>{content}</Timeline.Item>) }
                </Timeline>
            </Modal>
        </div>
    )
}

export default BulkUpdate;
